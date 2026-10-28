// CloudFront Function (viewer request) compartida por varios sitios
// estaticos en S3. Se publica UNA vez y se asocia a todas las
// distribuciones: cada request se resuelve segun su header Host.
//
// Para dar de alta un sitio nuevo se agrega una entrada a SITES. El resto
// es generico. (CloudFront Functions no soporta variables de entorno; la
// alternativa a esta tabla seria CloudFront KeyValueStore.)

var SITES = [
  {
    // Todos los dominios que entran a este sitio. Conviene incluir tambien
    // el d*.cloudfront.net de la distribucion: si no, las pruebas por ese
    // dominio caen en FALLBACK y no se comportan como el sitio real.
    hosts: ['www.fremitech.com', 'fremitech.com'],

    // A donde se redirige todo lo que no sea este dominio. Tiene que estar
    // en los Alternate Domain Names (CNAMEs) de la distribucion; si no, el
    // 301 apunta a un host que CloudFront no reconoce y el sitio muere.
    // '' = no redirigir.
    canonical: 'www.fremitech.com',

    // Carpeta del sitio dentro del bucket, igual que el Origin path de la
    // distribucion. '' si el sitio vive en la raiz. Solo se usa para
    // SACARLA de la URI si llega escrita: el Origin path la vuelve a
    // agregar y quedaria duplicada.
    folder: '/www.fremitech.com',

    // false -> prerenderizado: /planes sirve /planes/index.html
    // true  -> SPA: cualquier ruta sin extension sirve /index.html y el
    //          router del browser resuelve.
    spa: false,
  },
  {
    hosts: ['www.fremihome.com', 'fremihome.com'],
    canonical: 'www.fremihome.com',
    folder: '',
    spa: true,
  },
  {
    // App cliente (Expo export --platform web). Repo:
    // tecniredesall/fremihome-carwash-app-client
    // Conviene agregar aca tambien el d*.cloudfront.net de su distribucion.
    hosts: ['app.fremihome.com'],
    canonical: 'app.fremihome.com',

    // Asume bucket (u Origin path) propio para la app. Si la distribucion
    // tiene Origin path /app.fremihome.com, poner esa misma ruta aca.
    folder: '',

    // Expo con web.output = "single" exporta una sola index.html: toda ruta
    // la resuelve el router en el browser.
    spa: true,
  },
];

// Host que no figura en ninguna entrada: un dominio nuevo todavia sin dar
// de alta, o el d*.cloudfront.net de una distribucion. NO redirige a
// proposito: mandarlo al canonico de otro sitio lo dejaria inaccesible.
var FALLBACK = { canonical: '', folder: '', spa: true };

function siteFor(host) {
  for (var i = 0; i < SITES.length; i++) {
    if (SITES[i].hosts.indexOf(host) !== -1) return SITES[i];
  }
  return FALLBACK;
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : '';
  var site = siteFor(host);

  // --- 1. Normalizar la URI -------------------------------------------
  // Va ANTES del redirect a proposito: asi el 301 ya manda la URL limpia y
  // el browser no encadena dos saltos.
  var uri = request.uri.replace(/\/{2,}/g, '/');

  if (site.folder) {
    if (uri === site.folder) {
      uri = '/';
    } else if (uri.indexOf(site.folder + '/') === 0) {
      uri = uri.slice(site.folder.length);
    }
  }

  // --- 2. Dominio canonico --------------------------------------------
  if (site.canonical && host && host !== site.canonical) {
    var parts = [];
    for (var k in request.querystring) {
      var p = request.querystring[k];
      if (p.multiValue) {
        for (var i = 0; i < p.multiValue.length; i++) {
          parts.push(k + '=' + p.multiValue[i].value);
        }
      } else {
        parts.push(p.value ? k + '=' + p.value : k);
      }
    }
    var search = parts.length ? '?' + parts.join('&') : '';

    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://' + site.canonical + uri + search },
      },
    };
  }

  // --- 3. Resolucion de indice ----------------------------------------
  var last = uri.substring(uri.lastIndexOf('/') + 1);
  var isFile = last.indexOf('.') !== -1;

  if (uri === '/' || uri === '') {
    uri = '/index.html';
  } else if (!isFile) {
    // En una SPA no existe /planes/index.html: lo resuelve el router.
    uri = site.spa ? '/index.html' : uri.replace(/\/$/, '') + '/index.html';
  }

  request.uri = uri;
  return request;
}

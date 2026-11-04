// Extiende app.json en vez de reemplazarlo: Expo carga app.json primero y lo
// entrega como `config`, asi que aca solo va lo que depende del entorno.
//
// baseUrl le dice a Expo Router desde que ruta se sirve la app. Viene por env
// para que el build de CI publique en /carwash (ver .github/workflows/main.yml)
// y `expo start` local siga sirviendo desde la raiz. Tiene que empezar con "/"
// y no terminar en "/".
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;

  if (!baseUrl) return config;

  return {
    ...config,
    experiments: { ...config.experiments, baseUrl },
  };
};

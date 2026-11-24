// Avisos push en la web (parte 14 / paso 0). Lo registra la app con la
// configuración pública de Firebase en la dirección (?c=…): así no hay claves
// escritas aquí. Con la pestaña cerrada o en segundo plano, Firebase enseña
// el aviso (título y texto) y al tocarlo abre la pantalla (fcm_options.link).
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const config = JSON.parse(new URL(self.location).searchParams.get('c') || '{}');
if (config.apiKey) {
  firebase.initializeApp(config);
  firebase.messaging();
}

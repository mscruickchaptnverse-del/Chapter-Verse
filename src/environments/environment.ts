export const environment = {
  production: false,
  /**
   * Split marketing vs admin by hostname (leave empty for local dev — all routes on one host).
   * Example: publicHostnames: ['www.example.com','example.com'], adminHostnames: ['admin.example.com']
   */
  publicHostnames: [] as string[],
  adminHostnames: [] as string[],
  /** Full origin for redirects from public → admin (e.g. https://admin.example.com) */
  publicSiteOrigin: '',
  adminSiteOrigin: '',
  /** Firebase web app config — replace with values from Project settings (General). */
  firebase: {
    apiKey: 'AIzaSyCkAyT335OBp7ooP4SlIs4K5t-iAb37qSk',
    authDomain: 'chapter-verse-ec0ea.firebaseapp.com',
    projectId: 'chapter-verse-ec0ea',
    storageBucket: 'chapter-verse-ec0ea.appspot.com',
    messagingSenderId: '279570530036',
    appId: '1:279570530036:web:3fdd7484bd91c30059a8a1',
  },
  /** Legacy: homepage JSON in Storage (site now uses Firestore `site/homePage`). */
  homePageStoragePath: 'cms/home-page.json',
  /** Cloud Functions user-management is disabled until Blaze plan deploys functions. */
  adminFunctionsEnabled: false,
  /** EmailJS — copy IDs from https://dashboard.emailjs.com/admin */
  emailjs: {
    publicKey: 'I7tGM6liDMopVG-zR',
    serviceId: 'service_fnv7kso',
    templateId: 'template_j2ggg2m',
  },
};

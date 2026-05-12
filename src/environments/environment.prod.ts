export const environment = {
  production: true,
  /** Client site: .com — add both apex and www in Firebase Auth “Authorized domains”. */
  publicHostnames: ['chaptnverse.com', 'www.chaptnverse.com'],
  /** Admin site: this subdomain only (not apex .org). Add to Firebase Auth authorized domains. */
  adminHostnames: ['admin.chaptnverse.org'],
  publicSiteOrigin: 'https://chaptnverse.com',
  adminSiteOrigin: 'https://admin.chaptnverse.org',
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
  adminFunctionsEnabled: false,
  emailjs: {
    publicKey: 'I7tGM6liDMopVG-zR',
    serviceId: 'service_fnv7kso',
    templateId: 'template_j2ggg2m',
  },
};

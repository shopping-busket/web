import { Workbox } from 'workbox-window';

let wb: Workbox | null = null;

console.log('loading sw');

if ('serviceWorker' in navigator) {
  if (import.meta.env.NODE_ENV === 'production') {
    wb = new Workbox(`${import.meta.env.BASE_URL}service-worker.js`);

    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    await wb.register();
  } else {
    console.log('not registering sw in developement mode!');
  }
} else {
  wb = null;
}

export default wb;

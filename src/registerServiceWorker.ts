import { Workbox } from 'workbox-window';

// eslint-disable-next-line import/no-mutable-exports
let wb: Workbox | null = null;

console.log('loading sw');

if ('serviceWorker' in navigator) {
  if (process.env.NODE_ENV === 'production') {
    wb = new Workbox(`${process.env.BASE_URL}service-worker.js`);

    wb.addEventListener('controlling', () => {
      window.location.reload();
    });

    wb.register();
  } else {
    console.log('not registering sw in developement mode!');
  }
} else {
  wb = null;
}

export default wb;

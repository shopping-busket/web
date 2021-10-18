import { Workbox } from 'workbox-window';

// eslint-disable-next-line import/no-mutable-exports
let wb: Workbox | null;

console.log('loading sw');

if ('serviceWorker' in navigator) {
  wb = new Workbox(`${process.env.BASE_URL}service-worker.js`);

  wb.addEventListener('controlling', () => {
    window.location.reload();
  });

  wb.register();
} else {
  wb = null;
}

export default wb;

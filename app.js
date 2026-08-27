const carousel = document.querySelector('[data-carousel]');
const form = document.querySelector('#booking-form');
const dateInput = document.querySelector('#date');
const status = document.querySelector('#form-status');
const whatsappNumber = '14436768470';

if (carousel) {
  const track = carousel.querySelector('.gallery-track');
  const slides = [...carousel.querySelectorAll('.gallery-slide')];
  const dots = carousel.querySelector('[data-carousel-dots]');
  const count = carousel.querySelector('[data-carousel-count]');
  let currentIndex = 0;
  let autoplay;

  slides.forEach((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show gallery image ${index + 1}`);
    dot.addEventListener('click', () => goTo(index));
    dots.append(dot);
  });

  const update = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    count.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    dots.querySelectorAll('button').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === currentIndex);
      dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
    });
  };

  const goTo = (index) => {
    currentIndex = (index + slides.length) % slides.length;
    update();
  };

  const startAutoplay = () => {
    clearInterval(autoplay);
    autoplay = setInterval(() => goTo(currentIndex + 1), 5000);
  };

  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => goTo(currentIndex - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => goTo(currentIndex + 1));
  carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', () => clearInterval(autoplay));
  carousel.addEventListener('focusout', startAutoplay);
  update();
  startAutoplay();
}

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().split('T')[0];

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fullName = document.querySelector('#name').value.trim();
  const name = fullName.split(' ')[0];
  const service = document.querySelector('#service').value.split(' - ')[0];
  const barber = document.querySelector('#barber').value;
  const time = document.querySelector('#time').value;
  const date = new Date(`${dateInput.value}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const message = [
    'New booking request - Cosmic Styles LLC',
    `Name: ${fullName}`,
    `Service: ${service}`,
    `Barber: ${barber}`,
    `Date: ${date}`,
    `Time: ${time}`,
    '',
    'Please confirm this appointment.'
  ].join('\n');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener');
  status.textContent = `Thanks, ${name}. Your ${service.toLowerCase()} request for ${date} is on its way.`;
  form.querySelector('button').textContent = 'Open WhatsApp';
});

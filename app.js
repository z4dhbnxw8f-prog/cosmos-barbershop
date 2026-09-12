const carousel = document.querySelector('[data-carousel]');
const form = document.querySelector('#booking-form');
const dateInput = document.querySelector('#date');
const timeInput = document.querySelector('#time');
const formStatus = document.querySelector('#form-status');
const whatsappNumber = '14436768470';
const shopTimeZone = 'America/New_York';
const appointmentMinutes = 30;
const openingMinutes = 9 * 60 + 30;
const closingMinutes = 19 * 60 + 30;
const breakStartMinutes = 13 * 60 + 30;
const breakEndMinutes = 14 * 60;

const menuToggle = document.querySelector('.menu-toggle');
const mainNavigation = document.querySelector('#main-navigation');
if (menuToggle && mainNavigation) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    mainNavigation.classList.toggle('is-open', !isOpen);
  });
  mainNavigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    mainNavigation.classList.remove('is-open');
  }));
}

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

const lightbox = document.querySelector('#image-lightbox');
if (lightbox) {
  const lightboxImage = document.querySelector('#lightbox-image');
  let openedScrollPosition = 0;
  let openedTile = null;
  const closeLightbox = () => lightbox.close();

  document.querySelectorAll('.gallery-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      const image = tile.querySelector('img');
      openedScrollPosition = window.scrollY;
      openedTile = tile;
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      lightbox.showModal();
    });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('close', () => {
    window.scrollTo(0, openedScrollPosition);
    openedTile?.focus({ preventScroll: true });
  });
}

if (form) {
  const calendarGrid = document.querySelector('#calendar-grid');
  const calendarMonth = document.querySelector('#calendar-month');
  const previousMonthButton = document.querySelector('#calendar-prev');
  const nextMonthButton = document.querySelector('#calendar-next');
  const selectedDateLabel = document.querySelector('#selected-date');
  const timeSlots = document.querySelector('#time-slots');
  const summary = document.querySelector('#booking-summary');
  const emailButton = document.querySelector('#booking-email');
  const whatsappButton = document.querySelector('#booking-whatsapp');
  const nameInput = document.querySelector('#name');
  const emailInput = document.querySelector('#email');
  const phoneInput = document.querySelector('#phone');
  const notesInput = document.querySelector('#notes');
  const otherServiceDetails = document.querySelector('#other-service-details');
  const serviceDescriptionInput = document.querySelector('#service-description');

  const zonedParts = (date) => Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: shopTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)])
  );

  const nowAtShop = zonedParts(new Date());
  const today = new Date(nowAtShop.year, nowAtShop.month - 1, nowAtShop.day);
  const lastBookableDate = new Date(today);
  lastBookableDate.setDate(lastBookableDate.getDate() + 90);

  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = null;

  const dateKey = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');

  const isSameDate = (first, second) => first && second && dateKey(first) === dateKey(second);
  const isBookingDay = (date) => date.getDay() >= 1 && date.getDay() <= 6;
  const isInBookingRange = (date) => date >= today && date <= lastBookableDate && isBookingDay(date);

  const formatDate = (date, includeYear = true) => date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {})
  });

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
  };

  const selectedService = () => form.querySelector('input[name="service"]:checked');

  const updateSummary = () => {
    const service = selectedService();
    const hasOtherServiceDescription = service?.value !== 'Other service' || serviceDescriptionInput.value.trim();
    const ready = Boolean(service && selectedDate && timeInput.value && hasOtherServiceDescription);
    emailButton.disabled = !ready;
    whatsappButton.disabled = !ready;

    if (!ready) {
      summary.innerHTML = '<span>Select a service, date, and time to continue.</span>';
      return;
    }

    const startMinutes = Number(timeInput.dataset.minutes);
    const price = service.dataset.price === 'Custom' ? 'Price on request' : `$${service.dataset.price}`;
    summary.innerHTML = `<span><strong>${service.value}</strong> · ${price}</span><span>${formatDate(selectedDate, false)} · ${formatTime(startMinutes)}–${formatTime(startMinutes + appointmentMinutes)}</span>`;
  };

  const renderTimeSlots = () => {
    timeSlots.replaceChildren();
    timeInput.value = '';
    delete timeInput.dataset.minutes;

    if (!selectedDate) {
      selectedDateLabel.textContent = 'Select an available date';
      timeSlots.innerHTML = '<span class="empty-slots">Monday–Saturday<br>9:30 AM–7:30 PM</span>';
      updateSummary();
      return;
    }

    selectedDateLabel.textContent = `${formatDate(selectedDate)} · Eastern Time`;
    const currentShopTime = zonedParts(new Date());
    const selectedIsToday = isSameDate(selectedDate, today);
    const currentMinutes = currentShopTime.hour * 60 + currentShopTime.minute;
    let availableCount = 0;

    for (let minutes = openingMinutes; minutes + appointmentMinutes <= closingMinutes; minutes += appointmentMinutes) {
      if (selectedIsToday && minutes <= currentMinutes) continue;
      if (minutes >= breakStartMinutes && minutes < breakEndMinutes) continue;

      const label = document.createElement('label');
      label.className = 'time-slot';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'appointment-time';
      input.value = formatTime(minutes);
      input.addEventListener('change', () => {
        timeInput.value = input.value;
        timeInput.dataset.minutes = String(minutes);
        formStatus.textContent = '';
        updateSummary();
      });
      label.append(input, document.createTextNode(formatTime(minutes)));
      timeSlots.append(label);
      availableCount += 1;
    }

    if (!availableCount) {
      timeSlots.innerHTML = '<span class="empty-slots">No remaining times today.<br>Please choose another date.</span>';
    }
    updateSummary();
  };

  const chooseDate = (date) => {
    selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    dateInput.value = dateKey(selectedDate);
    formStatus.textContent = '';
    renderCalendar();
    renderTimeSlots();
  };

  function renderCalendar() {
    calendarGrid.replaceChildren();
    calendarMonth.textContent = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
    const mondayFirstOffset = (firstDay.getDay() + 6) % 7;

    for (let index = 0; index < mondayFirstOffset; index += 1) {
      const blank = document.createElement('span');
      blank.className = 'calendar-blank';
      calendarGrid.append(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'calendar-day';
      button.textContent = String(day);
      button.disabled = !isInBookingRange(date);
      button.setAttribute('aria-label', `${formatDate(date)}${button.disabled ? ', unavailable' : ', available'}`);
      button.classList.toggle('is-today', isSameDate(date, today));
      button.classList.toggle('is-selected', isSameDate(date, selectedDate));
      if (!button.disabled) button.addEventListener('click', () => chooseDate(date));
      calendarGrid.append(button);
    }

    const earliestMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const latestMonth = new Date(lastBookableDate.getFullYear(), lastBookableDate.getMonth(), 1);
    previousMonthButton.disabled = visibleMonth <= earliestMonth;
    nextMonthButton.disabled = visibleMonth >= latestMonth;
  }

  previousMonthButton.addEventListener('click', () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener('click', () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  form.querySelectorAll('input[name="service"]').forEach((input) => {
    input.addEventListener('change', () => {
      const isOtherService = input.checked && input.value === 'Other service';
      otherServiceDetails.hidden = !isOtherService;
      serviceDescriptionInput.required = isOtherService;
      if (!isOtherService) serviceDescriptionInput.value = '';
      if (isOtherService) serviceDescriptionInput.focus();
      formStatus.textContent = '';
      updateSummary();
    });
  });

  serviceDescriptionInput.addEventListener('input', updateSummary);

  const getBooking = () => {
    const service = selectedService();

    if (!service || !selectedDate || !timeInput.value) {
      formStatus.textContent = 'Please choose a service, date, and time.';
      return null;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      formStatus.textContent = 'Please complete your contact details.';
      return null;
    }

    if (service.value === 'Other service' && !serviceDescriptionInput.value.trim()) {
      formStatus.textContent = 'Please describe the service you want.';
      serviceDescriptionInput.focus();
      return null;
    }

    const fullName = nameInput.value.trim();
    const firstName = fullName.split(' ')[0];
    const date = formatDate(selectedDate);
    const startMinutes = Number(timeInput.dataset.minutes);
    const notes = notesInput.value.trim();
    return {
      firstName,
      name: fullName,
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      service: service.value,
      serviceDescription: serviceDescriptionInput.value.trim(),
      price: service.dataset.price,
      date,
      time: `${formatTime(startMinutes)} - ${formatTime(startMinutes + appointmentMinutes)} Eastern Time`,
      notes
    };
  };

  const bookingMessage = (booking) => [
      'New booking request - Cosmic Styles LLC',
      `Name: ${booking.name}`,
      `Email: ${booking.email}`,
      `Phone: ${booking.phone}`,
      `Service: ${booking.service} ($${booking.price})`,
      ...(booking.serviceDescription ? [`Service details: ${booking.serviceDescription}`] : []),
      `Date: ${booking.date}`,
      `Time: ${booking.time}`,
      'Duration: 30 minutes',
      ...(booking.notes ? [`Notes: ${booking.notes}`] : []),
      '',
      'Please confirm this appointment.'
    ].join('\n');

  whatsappButton.addEventListener('click', () => {
    const booking = getBooking();
    if (!booking) return;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(bookingMessage(booking))}`;
    window.open(whatsappUrl, '_blank', 'noopener');
    whatsappButton.innerHTML = 'Open WhatsApp <span aria-hidden="true">&#8599;</span>';
    formStatus.textContent = `Thanks, ${booking.firstName}. Your request is ready in WhatsApp.`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const booking = getBooking();
    if (!booking) return;

    const endpoint = form.dataset.formspreeEndpoint;
    if (!endpoint || endpoint.includes('REPLACE_WITH_YOUR_FORM_ID')) {
      formStatus.textContent = 'Email booking is not set up yet. Please use WhatsApp or add your Formspree form ID.';
      return;
    }

    emailButton.disabled = true;
    emailButton.textContent = 'Sending request…';

    try {
      const notificationResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams({
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          service: booking.service,
          service_description: booking.serviceDescription,
          price: `$${booking.price}`,
          date: booking.date,
          time: booking.time,
          notes: booking.notes,
          _subject: `New booking request: ${booking.name}`
        })
      });

      if (!notificationResponse.ok) throw new Error('Notification request failed');
      formStatus.textContent = `Thanks, ${booking.firstName}. Your booking request has been sent by email.`;
    } catch (error) {
      formStatus.textContent = 'We could not send your email request. Please try WhatsApp instead.';
    } finally {
      emailButton.innerHTML = 'Send booking request <span aria-hidden="true">&#8594;</span>';
      updateSummary();
    }
  });

  renderCalendar();
  renderTimeSlots();
}

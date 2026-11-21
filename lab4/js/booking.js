'use strict';

// Конструктор сохраняет данные конкретной заявки, метод использует this.
class TastingBooking {
  constructor(data) {
    this.name = data.get('name').trim();
    this.email = data.get('email').trim();
    this.guests = Number(data.get('guests'));
    this.coffee = data.get('coffee');
    this.comment = data.get('comment').trim();
    this.consent = data.get('consent') === 'yes';
  }

  printToConsole() {
    console.group('Coffee Compass — заявка на дегустацию');
    console.table({
      'Имя': this.name,
      'Электронная почта': this.email,
      'Гостей': this.guests,
      'Зёрна': this.coffee,
      'Комментарий': this.comment || 'Без комментария',
      'Согласие': this.consent ? 'Да' : 'Нет'
    });
    console.groupEnd();
  }
}

const form = document.querySelector('.booking-form');
const status = form.querySelector('.booking-form__status');
const submit = form.querySelector('.booking-form__submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity() || submit.disabled) return;
  const booking = new TastingBooking(new FormData(form));
  booking.printToConsole();
  submit.disabled = true;
  status.classList.remove('booking-form__status_error');
  status.textContent = 'Отправляем заявку…';
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('Сервер отклонил заявку');
    const result = await response.json();
    status.textContent = `Спасибо, ${booking.name}! Заявка № ${result.id} принята.`;
    form.reset();
  } catch (error) {
    status.classList.add('booking-form__status_error');
    status.textContent = 'Не удалось отправить заявку. Проверьте, что сайт запущен через npm start, и повторите попытку. Введённые данные сохранены в форме.';
  } finally {
    submit.disabled = false;
  }
});

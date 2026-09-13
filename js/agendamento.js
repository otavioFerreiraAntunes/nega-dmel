// ============================================================================
// Agendamento — calendário, taxa por cidade e envio via WhatsApp
// ============================================================================

const WHATSAPP_NUMBER = '5511989708027'; // 11 98970-8027

const MESES = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro'
];
const DIAS_SEMANA = ['D','S','T','Q','Q','S','S'];

const FEES = {
  louveira: 10,
  vinhedo: 20
};

let viewDate = new Date();
viewDate.setDate(1);

let selectedDate = null;   // Date object
let selectedSlot = null;   // string, ex: "09:00"

const calendarGrid   = document.getElementById('calendarGrid');
const monthLabel      = document.getElementById('monthLabel');
const prevMonthBtn    = document.getElementById('prevMonth');
const nextMonthBtn    = document.getElementById('nextMonth');
const weekdayRow      = document.getElementById('weekdayRow');
const selectedDateInput = document.getElementById('selectedDateInput');
const selectedTimeInput = document.getElementById('selectedTimeInput');
const summaryDate     = document.getElementById('summaryDate');
const summaryTime     = document.getElementById('summaryTime');
const summaryFee      = document.getElementById('summaryFee');

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function renderWeekdayRow() {
  weekdayRow.innerHTML = DIAS_SEMANA.map(d => `<span>${d}</span>`).join('');
}

function renderCalendar() {
  monthLabel.textContent = `${MESES[viewDate.getMonth()]} de ${viewDate.getFullYear()}`;

  const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = firstDay.getDay(); // 0 = domingo
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const today = new Date();
  today.setHours(0,0,0,0);

  let html = '';

  for (let i = 0; i < startOffset; i++) {
    html += `<div class="day-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const isPast = cellDate < today;
    const isWeekday = cellDate.getDay() !== 0 && cellDate.getDay() !== 6;
    const disabled = isPast || isWeekday;

    const classes = ['day-cell'];
    if (disabled) classes.push('disabled');
    if (isSameDay(cellDate, today)) classes.push('today');
    if (selectedDate && isSameDay(cellDate, selectedDate)) classes.push('selected');

    html += `<div class="${classes.join(' ')}" data-date="${cellDate.toISOString()}" ${disabled ? '' : 'role="button" tabindex="0"'}>${day}</div>`;
  }

  calendarGrid.innerHTML = html;

  calendarGrid.querySelectorAll('.day-cell:not(.empty):not(.disabled)').forEach(cell => {
    cell.addEventListener('click', () => {
      selectedDate = new Date(cell.dataset.date);
      renderCalendar();
      updateSummary();
    });
  });
}

prevMonthBtn.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
});

// ------------------------------- horários ----------------------------------

document.querySelectorAll('.slot-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedSlot = btn.dataset.time;
    updateSummary();
  });
});

// -------------------------------- cidade ------------------------------------

const cityRadios = document.querySelectorAll('input[name="cidade"]');
cityRadios.forEach(radio => {
  radio.addEventListener('change', updateSummary);
});

function formatDatePtBr(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function getSelectedCity() {
  const checked = document.querySelector('input[name="cidade"]:checked');
  return checked ? checked.value : null;
}

function updateSummary() {
  summaryDate.textContent = selectedDate ? formatDatePtBr(selectedDate) : 'não selecionada';
  summaryTime.textContent = selectedSlot || 'não selecionado';

  const city = getSelectedCity();
  if (city && FEES[city] !== undefined) {
    const cityLabel = city === 'louveira' ? 'Louveira' : 'Vinhedo';
    summaryFee.textContent = `Taxa de deslocamento (${cityLabel}): R$ ${FEES[city]},00`;
  } else {
    summaryFee.textContent = 'Selecione a cidade para ver a taxa';
  }

  if (selectedDateInput) selectedDateInput.value = selectedDate ? selectedDate.toISOString() : '';
  if (selectedTimeInput) selectedTimeInput.value = selectedSlot || '';
}

// -------------------------------- envio --------------------------------------

const form = document.getElementById('bookingForm');
const formError = document.getElementById('formError');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const estilo = document.getElementById('estilo').value;
  const cidade = getSelectedCity();
  const obs = document.getElementById('observacoes').value.trim();

  const missing = [];
  if (!nome) missing.push('nome');
  if (!telefone) missing.push('telefone');
  if (!estilo) missing.push('estilo desejado');
  if (!selectedDate) missing.push('data');
  if (!selectedSlot) missing.push('horário');
  if (!cidade) missing.push('cidade');

  if (missing.length) {
    formError.textContent = `Preencha antes de enviar: ${missing.join(', ')}.`;
    formError.style.display = 'block';
    return;
  }
  formError.style.display = 'none';

  const cityLabel = cidade === 'louveira' ? 'Louveira' : 'Vinhedo';
  const fee = FEES[cidade];

  const message =
`Oi Nega D'Mel! Quero agendar um horário.

Nome: ${nome}
Telefone: ${telefone}
Estilo desejado: ${estilo}
Data: ${formatDatePtBr(selectedDate)}
Horário: ${selectedSlot}
Cidade: ${cityLabel} (taxa de deslocamento: R$ ${fee},00)
${obs ? `Observações: ${obs}` : ''}`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});

// -------------------------------- init ----------------------------------------

renderWeekdayRow();
renderCalendar();
updateSummary();

// Pré-selecionar estilo se vier da página de estilos (?estilo=...)
const urlParams = new URLSearchParams(window.location.search);
const estiloParam = urlParams.get('estilo');
if (estiloParam) {
  const estiloSelect = document.getElementById('estilo');
  if (estiloSelect) {
    for (let opt of estiloSelect.options) {
      if (opt.value.toLowerCase() === estiloParam.toLowerCase()) {
        opt.selected = true;
        break;
      }
    }
  }
}


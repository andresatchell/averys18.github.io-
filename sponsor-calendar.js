/* ============================================================
   SPONSOR-A-DAY CALENDAR MODULE
   Powers the "2 · Sponsor a Day" panel on the recruiting site.
   Each open day defaults to a $10 Cash App request; visitors can
   type their own amount instead using the custom field.

   MAINTENANCE — everything you'll need to touch lives in CONFIG below:
   - year / month   : which month is on sale (month is 0-indexed, so 9 = October).
   - cashtag        : the real Cash App $cashtag (no leading $).
   - soldDays       : after you confirm a Cash App payment for a given day,
                       add that day number here and re-upload this file.
                       That day then shows as permanently SOLD for every
                       visitor. This step is manual because a static HTML
                       page has no server/database to verify payments on
                       its own — there's nothing for it to check against.

   This file is loaded as a native ES module (<script type="module" src="sponsor-calendar.js">),
   so it only runs once and never leaks its variables into the global scope.
   ============================================================ */

export const CONFIG = {
  year: 2026,
  month: 9, // October (0-indexed)
  cashtag: 'AverySatch18',
  soldDays: [], // e.g. [3, 7, 12]
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export function initSponsorCalendar(config = CONFIG){
  const { year, month, cashtag, soldDays } = config;
  const monthLabel = MONTH_NAMES[month] + ' ' + year;

  const monthNameEl   = document.getElementById('calMonthName');
  const monthLabelEl  = document.getElementById('calMonthLabel');
  const gridEl        = document.getElementById('calGrid');
  const pickerEl      = document.getElementById('calPicker');
  const pickHeadEl    = document.getElementById('pickHead');
  const chip10        = document.getElementById('chip10');
  const customInput   = document.getElementById('customAmount');
  const customWrap     = document.getElementById('amountCustomWrap');
  const cashBtn        = document.getElementById('cashAppBtn');
  const giveDayNoteEl  = document.getElementById('giveDayNote');

  if(!gridEl) return; // panel isn't on this page — nothing to do

  monthNameEl.textContent = monthLabel;
  monthLabelEl.textContent = monthLabel;

  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstWeekday  = new Date(year, month, 1).getDay(); // 0 = Sunday
  const DEFAULT_AMOUNT = 10;

  // "pending" = claimed in THIS browser only (localStorage), so a visitor
  // doesn't accidentally pay for the same day twice. It is NOT a real
  // cross-visitor lock — only editing soldDays above does that.
  const PENDING_KEY = 'avery-sponsor-pending-' + year + '-' + month;
  let pendingDays = [];
  try{ pendingDays = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]'); }
  catch(e){ pendingDays = []; }

  let selectedDay = null;
  let selectedAmount = DEFAULT_AMOUNT;

  for(let i = 0; i < firstWeekday; i++){
    const blank = document.createElement('div');
    blank.className = 'cal-day blank';
    gridEl.appendChild(blank);
  }

  for(let day = 1; day <= daysInMonth; day++){
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-day';
    cell.textContent = day;
    cell.dataset.day = day;

    if(soldDays.includes(day)){
      cell.classList.add('sold');
      cell.disabled = true;
    } else if(pendingDays.includes(day)){
      cell.classList.add('pending');
    }

    cell.addEventListener('click', () => selectDay(day, cell));
    gridEl.appendChild(cell);
  }

  chip10.addEventListener('click', () => {
    selectedAmount = DEFAULT_AMOUNT;
    customInput.value = '';
    chip10.classList.add('active');
    customWrap.classList.remove('active');
    updateCashBtn();
  });

  customInput.addEventListener('input', () => {
    const v = parseFloat(customInput.value);
    if(customInput.value !== '' && v > 0){
      selectedAmount = Math.min(500, v);
      chip10.classList.remove('active');
      customWrap.classList.add('active');
    } else {
      selectedAmount = DEFAULT_AMOUNT;
      chip10.classList.add('active');
      customWrap.classList.remove('active');
    }
    updateCashBtn();
  });

  function selectDay(day, cell){
    gridEl.querySelectorAll('.cal-day.selected').forEach(el => el.classList.remove('selected'));
    cell.classList.add('selected');
    selectedDay = day;

    // reset the picker back to the $10 default each time a new day is chosen
    selectedAmount = DEFAULT_AMOUNT;
    customInput.value = '';
    chip10.classList.add('active');
    customWrap.classList.remove('active');

    pickHeadEl.textContent = monthLabel.split(' ')[0] + ' ' + day;
    giveDayNoteEl.textContent = day;

    pickerEl.classList.add('open');
    updateCashBtn();
    pickerEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updateCashBtn(){
    if(!selectedDay){
      cashBtn.textContent = 'Pick a day above';
      cashBtn.setAttribute('disabled', '');
      cashBtn.removeAttribute('href');
      return;
    }
    const amt = selectedAmount || DEFAULT_AMOUNT;
    cashBtn.textContent = 'Send $' + amt + ' via Cash App';
    cashBtn.removeAttribute('disabled');
    cashBtn.href = 'https://cash.app/$' + cashtag + '/' + amt;

    cashBtn.onclick = function(){
      if(!pendingDays.includes(selectedDay)){
        pendingDays.push(selectedDay);
        try{ localStorage.setItem(PENDING_KEY, JSON.stringify(pendingDays)); }
        catch(e){ /* localStorage unavailable — pending state just won't persist */ }
      }
      const cell = gridEl.querySelector('.cal-day[data-day="' + selectedDay + '"]');
      if(cell) cell.classList.add('pending');
    };
  }
}

// Auto-run on the page using the default CONFIG above.
// (A module script already executes after the DOM has parsed, so no
// DOMContentLoaded listener is needed here.)
initSponsorCalendar(CONFIG);

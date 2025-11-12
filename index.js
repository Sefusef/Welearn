document.addEventListener('contextmenu', event => event.preventDefault());
document.onkeydown = function(e) {
if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
return false;
}
if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
return false;
}
};

document.addEventListener('DOMContentLoaded', () => {
const accordions = document.querySelectorAll('.accordion');

accordions.forEach(accordion => {
const label = accordion.querySelector('label');
const content = accordion.querySelector('.accordion-content');

label.addEventListener('click', () => {
const isContentVisible = content.style.display === 'block';

accordions.forEach(otherAccordion => {
const otherContent = otherAccordion.querySelector('.accordion-content');
if (otherContent) {
otherContent.style.display = 'none';
}
});

if (!isContentVisible) {
content.style.display = 'block';
}
});
});
});

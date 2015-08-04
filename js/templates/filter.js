export function Filter(name) {
    var filter = document.createElement('div');
    var tpl =
    `
        <input type="checkbox" checked="">${name}</input>
    `;

    filter.className = 'filter';
    filter.innerHTML = tpl;
    return filter;
}

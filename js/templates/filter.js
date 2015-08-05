export function Filter(name) {
    var filter = document.createElement('div');
    var tpl =
    `
        <input type="checkbox" checked="checked" value="${name}"><span class="filter-name">${name}</span>
    `;

    filter.className = 'filter';
    filter.innerHTML = tpl;
    return filter;
}

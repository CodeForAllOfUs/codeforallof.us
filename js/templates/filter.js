export function Filter(name) {
    var filter = document.createElement('div');
    var tpl =
    `
        <label class="filter-name"><input type="checkbox" checked="checked" value="${name}"> ${name}</label>
    `;

    filter.className = 'filter';
    filter.innerHTML = tpl;
    return filter;
}

export function ListItem(ctx) {
    var listItem = document.createElement('div');
    var tpl =
    `
        <h1><a href="${ctx.homepage}">${ctx.name}</a></h1>
        <p>${ctx.description}</p>
    `;

    listItem.className = 'list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

export function ProjectListItem(ctx) {
    var listItem = document.createElement('div');
    var tpl =
    `
        <h1><a href="${ctx.homepage}">${ctx.name}</a></h1>
        <p>${ctx.description}</p>
    `;

    listItem.setAttribute('id', ctx.id);
    listItem.className = 'list-item project-list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

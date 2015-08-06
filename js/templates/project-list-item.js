export function ProjectListItem(ctx) {
    var listItem = document.createElement('div');
    var tpl =
    `
        <h2><a href="${ctx.homepage}">${ctx.name}</a></h2>
        <p>${ctx.description}</p>
    `;

    listItem.setAttribute('data-id', ctx.id);
    listItem.className = 'list-item project-list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

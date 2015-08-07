export function ProjectListItem(ctx) {
    var listItem = document.createElement('tr');
    var tpl =
    `
        <td class="list-item-id">${ctx.id}</td>
        <td class="list-item-id">${ctx.organization.name}</td>
        <td>
            <h2><a href="${ctx.homepage}">${ctx.name}</a></h2>
            <p>${ctx.description}</p>
        </td>
    `;

    listItem.setAttribute('data-id', ctx.id);
    listItem.setAttribute('data-org-id', ctx.organizationId);
    listItem.className = 'list-item project-list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

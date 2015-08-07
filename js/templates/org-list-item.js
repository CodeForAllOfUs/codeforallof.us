export function OrgListItem(ctx) {
    var listItem = document.createElement('tr');
    var tpl =
    `
        <td class="list-item-id">${ctx.id}</td>
        <td>
            <h2><a href="${ctx.homepage}">${ctx.name}</a></h2>
            <p>${ctx.description}</p>
        </td>
    `;

    listItem.setAttribute('data-id', ctx.id);
    listItem.className = 'list-item org-list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

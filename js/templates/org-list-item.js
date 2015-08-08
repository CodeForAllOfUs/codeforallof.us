export function OrgListItem(ctx) {
    var listItem = document.createElement('tr');
    var tpl =
    `
        <td>
            <h3><a href="${ctx.homepage}">${ctx.name}</a></h3>
            <p>${ctx.description}</p>
        </td>
    `;

    listItem.setAttribute('data-id', ctx.id);
    listItem.className = 'list-item org-list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

export function OrgListItem(ctx) {
    var listItem = document.createElement('tr');
    var githubLink = '';

    if (ctx.github) {
        githubLink = ` <a href="https://github.com/${ctx.github}"><i class="fa fa-github"></i></a>`;
    }

    var tpl =
    `
        <td>
            <h3><a href="${ctx.homepage}">${ctx.name}</a>${githubLink}</h3>
            <p>${ctx.description}</p>
        </td>
    `;

    listItem.setAttribute('data-id', ctx.id);
    listItem.className = 'list-item org-list-item';
    listItem.innerHTML = tpl;
    return listItem;
}

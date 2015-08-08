export function Loading(msg = '') {
    var loading = document.createElement('div');
    var tpl = `<i class="loading-icon fa fa-circle-o-notch"></i><span class="loading-msg">${msg}</span>`;
    loading.className = 'loading';
    loading.innerHTML = tpl;
    return loading;
}

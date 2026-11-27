function showToast(message){const region=document.querySelector('#toast-region');if(!region)return;const toast=document.createElement('div');toast.className='toast';toast.textContent=message;region.appendChild(toast);window.setTimeout(()=>toast.remove(),3200)}


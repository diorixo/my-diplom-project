const swiper = new Swiper('.swiper', {
    // Optional parameters
    loop: true,
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
  
    // If we need pagination
    pagination: {
        el: '.swiper-pagination',
    },
  
    // Navigation arrows
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
});

document.querySelectorAll('.info_triger').forEach((item) => {
    item.addEventListener('click', () => {
        item.parentNode.classList.toggle('info_item_active')
    })
});
$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');
    let urlProductName = urlParams.get('product_name');

    let card = [];

    if(!card || card.length === 0) {
       let localOrders = getOrders();

       if(Array.isArray(localOrders)) {
         localOrders.forEach(item => {
            card[item.getId] = item;
         });
       }

     sumCardTotal();
    }

    console.log(card);

    let products = [];
    let category = [];
    let selectedCategory = '';
    let batchSize = 20;
    let currentIndex = 0;
    let isLoading = false;
    let customData = [];

    $.getJSON("products.json?v=143", function(data) {
      products = data.products;
      getCategoryList();

      drawSliderItem();


      if(urlProductName) {
        urlProductName = urlProductName.replace(/20\/?/g, ' ');
        return searchByName(urlProductName.toLowerCase().trim());
      }

      else if(urlCategory) {
        return selectCategory(urlCategory);
      }

      loadProducts();
    });



    $(document).on('click', '.hide-price', function() {
      $('.products-price').toggleClass('hide-product-price');
    });



    $(window).on("scroll", function () {
      if($(window).scrollTop() > 100) {
        $('.search-container').addClass('search-container-scrolled');
        $('.scroll-nav').addClass('display-flex');
      } else { 
        $('.scroll-nav').removeClass('display-flex');
        $('.search-container').removeClass('search-container-scrolled');
      }

      if (!isLoading && $(window).scrollTop() + $(window).height() >= $(document).height() - 400) {
        if (currentIndex < products.length) {
          isLoading = true;
          setTimeout(() => {
            loadProducts();
          }, 400);
        }
      }
    });

    $('.scroll-top').on('click', function() {
      scrollTop();
    });

    $(document).on('input', '.search-json', function() {
       let $delay = 450;
       let vals = $(this).val().toLowerCase().trim();


       if(vals.length > 2) {
         clearTimeout($(this).data('timer'));

         $(this).data('timer', setTimeout(function() {
            // let jsonSearchArr = [];

            searchByName(vals);
         }, $delay));
       }

       if(!vals || vals === 'undefined') {
         $(".products-list").html('');
         currentIndex = 0;
         resetSearchResult();
         selectedRandomCategory();
         loadProducts();
       }
    });


    $(document).on('change', '.select-category', function() {
      let val = $(this).val();

      selectCategory(val);

      scrollTop();
    });


    $(document).on('click', '.open-add-to-card-modal', function() {
        $('.add-to-card-modal').addClass('display-flex');

        let $this = $(this).closest('.products-card');

        let imageSrc = $this.find('.prodcuts-image > img').attr('src');
        let productName = $this.find('.products-name').text();
        let productPrice = $this.find('.products-price').text();
        let id = $this.find('.id').val();

        let productsBrand = $this.find('.product-brand').text() ?? '';

        $('.cart-product-image > img').attr('src', imageSrc);
        
        $('.card-product-name').html(productName);
        
        $('.cart-product-price').text(productPrice);

        $('.cart-brand').html(productsBrand);

        $('.cart-id').val(id);
        
        $('.count').focus();

        $('body').addClass('overflow-hidden');
    });


    $(document).on('click', '.add-to-card', function() {
        closeCartModal();
        let $this = $(this).closest('.add-to-card-modal');

        let imageSrc = $this.find('.cart-product-image > img').attr('src');
        let productName = $this.find('.card-product-name').text();
        let productPrice = $this.find('.cart-product-price').text();
        let count = $this.find('.count').val();
        let brand = $this.find('.cart-brand').text();


        if(!count || count <=0) {
          count = 1;
        }

        let getId = $this.find('.cart-id').val();

        if (!card[getId]) {
          card[getId] = [];
        }  

          card[getId] = {
            "imageSrc": imageSrc,
            "productName": productName,
            "productPrice": productPrice,
            "count": count,
            "getId": getId,
            "brand": brand
          };

        $('.count').val('');

        $('.showNotice').addClass('active');

        setTimeout(function(){
          $('.showNotice').removeClass('active');
       }, 1000);

        updateLocalStorage();

        sumCardTotal();
    });


    $(document).on('click', '.close-add-card-modal', function() {
      closeCartModal();
    });


    $(document).on('click', '.close-card-list', function() {
      $('.cart-list-modal').removeClass(['display-flex', 'active']);
      $('body').removeClass('overflow-hidden');

    });


    $(document).on('click', '.openCart', function() {
      let savedOrder = getOrders();

        $('body').addClass('overflow-hidden');


      $('.cart-list').html('');
      $('.cart-list-modal').addClass(['display-flex', 'active']);

      let targetBrands = ['Foni', 'Euroacs', 'Joyroom'];

      // {imageSrc: '/img/3.jpg', productName: '3 Qulaqlıq BT Euroacs EU-HS30 Black', productPrice: '0.60₼', count: '23', getId: 'SSW3767'}
      Object.keys(savedOrder).map(function(objectKey, index) {
          var row = savedOrder[objectKey];
          
          let itemSum = sumItemTotal(row.count, row.productPrice);

          $('.cart-list').prepend(`
            <div class="cart-list-item">
               <div class="cart-list-image">
                <img src="${row.imageSrc}">
               </div>

               <div class="cart-list-info">
                  <span class="delete-product-at-card"><i class="las la-times"></i></span>

                  <span class="cart-list-item-name">${row.productName}</span>
                  <span class="cart-list-item-productPrice">${row.productPrice}</span>

                  <div class="cart-list-info-count-group">
                    <span class="cart-label">Say:</span>
                    <input type="number" class="input cart-list-item-count" value="${row.count}">

                    <div class="ssd">

                      <p class="sum">
                         <span class="sum-title">Toplam:</span> 
                        <span class="cart-list-item-total">${sumItemTotal(row.count, row.productPrice)}₼</span> 
                      </p>
                    <div>


                  </div>

                  <input type="hidden" class="cart-list-item-id" value="${row.getId}">
               </div>
            </div>
          `);
      });
    });

    $(document).on('click', '.delete-product-at-card', function() {
       let id = $(this).closest('.cart-list-info').find('.cart-list-item-id').val();

       delete card[id];

       $(this).closest('.cart-list-item').remove();

       sumCardTotal();
       updateLocalStorage();
    });


    $(document).on('click', '.send-cart', function() {
      let strs = '';
      let orderId = Date.now();


        // **Тестируем**
      order = {
          id: orderId,
          card: []
      };


      Object.keys(card).map(function(objectKey, index) {
          var row = card[objectKey];

          strs = strs + `${row.productName} - ${row.count} ədəd \n \n`;

          row.productPrice = row.productPrice.replace('₼', ' AZN')

          order.card.push(row);
      });      

        strs = strs + `https://gpr-xirdalan.github.io/orderView.html?orderId=${orderId}`;

        $.ajax({
          url: 'https://gpr-xirdalan-github-io.vercel.app/api/saveOrder',
          type: 'POST',
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(order),
          beforeSend: () => {
            $('.preloader').removeClass('hide');
          },
          success: () => {
            $('.preloader').addClass('hide');

            let encodedStrs = encodeURIComponent(strs); 

            let url = `https://wa.me/994512058808?text=${encodedStrs}`;

            window.location.href = url;

            card = [];

            $('.cart-list').html('');   

            sumCardTotal();

            updateLocalStorage();
          }
        });
    });


    function closeCartModal() {
      $('.add-to-card-modal').removeClass('display-flex');
      $('body').removeClass('overflow-hidden');
    } 

    $(document).on('input', '.cart-list-item-count', function() {
       let $delay = 450;
       let getId = $(this).closest('.cart-list-item').find('.cart-list-item-id').val();
       let newCount = $(this).val();

       clearTimeout($(this).data('timer'));
      
       $(this).data('timer', setTimeout(function(){
         card[getId].count = newCount;
          sumCardTotal(); 

          updateLocalStorage();
       }, $delay));



       $(this).closest('.cart-list-item').find('.cart-list-item-total').html(`${sumItemTotal(newCount, card[getId].productPrice)}`);

    });


  function sumItemTotal(count, price) {
    price = price.replace('₼', '');
    return (count * price).toFixed(2);
  }


  function loadProducts() {
    let filtredData = [];

    if (currentIndex >= products.length) return;

    let endIndex = Math.min(currentIndex + batchSize, products.length);

    if(selectedCategory) {      
      filtredData = products.filter(item => item.category.toLowerCase().trim() == selectedCategory.toLowerCase().trim());
    } else {
      filtredData = products;
    }

    if(customData.length > 0) {
       filtredData = customData;
    }


    console.log(filtredData.length);

    let batch = filtredData.slice(currentIndex, endIndex);

    promises = [];

    $.each(batch, function(key, val) {
      promises.push(appendProductCard(val));
    });

    Promise.all(promises).then(() => {
        isLoading = false;
        currentIndex = endIndex;
    });    
  }

  $(document).on('click', '.share', function() {
    let dataName = $(this).attr('data-name');

    let url = `https://gpr-xirdalan.github.io/?product_name=${dataName}`;
    let fixedUrl = url.replace(/ /g, '20/'); 
    let whatsappLink = `https://wa.me/994512058808?text=${encodeURIComponent(fixedUrl)}`;

    window.location.href = whatsappLink;
  });



  function prepareProductCardTpl(product) {
    const targetBrands = ['Foni', 'Euroacs', 'Joyroom'];

    let cashbackChips = ''
    
    if(targetBrands.includes(product.brand)) {
      cashbackChips = `<span class="cashback-chips">2% CASHBACK</span>`;
    }


    // let urlParse = encodeURIComponent(product.name);
    return `
        <div class="products-card animate__animated animate__fadeIn">
          <a href="javascript:void(0)" class="share" data-name="${product.name}">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" x="0" y="0" viewBox="0 0 512 512.001" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M361.824 344.395c-24.531 0-46.633 10.593-61.972 27.445l-137.973-85.453A83.321 83.321 0 0 0 167.605 256a83.29 83.29 0 0 0-5.726-30.387l137.973-85.457c15.34 16.852 37.441 27.45 61.972 27.45 46.211 0 83.805-37.594 83.805-83.805C445.629 37.59 408.035 0 361.824 0c-46.21 0-83.804 37.594-83.804 83.805a83.403 83.403 0 0 0 5.726 30.386l-137.969 85.454c-15.34-16.852-37.441-27.45-61.972-27.45C37.594 172.195 0 209.793 0 256c0 46.21 37.594 83.805 83.805 83.805 24.53 0 46.633-10.594 61.972-27.45l137.97 85.454a83.408 83.408 0 0 0-5.727 30.39c0 46.207 37.593 83.801 83.804 83.801s83.805-37.594 83.805-83.8c0-46.212-37.594-83.805-83.805-83.805zm-53.246-260.59c0-29.36 23.887-53.246 53.246-53.246s53.246 23.886 53.246 53.246c0 29.36-23.886 53.246-53.246 53.246s-53.246-23.887-53.246-53.246zM83.805 309.246c-29.364 0-53.25-23.887-53.25-53.246s23.886-53.246 53.25-53.246c29.36 0 53.242 23.887 53.242 53.246s-23.883 53.246-53.242 53.246zm224.773 118.95c0-29.36 23.887-53.247 53.246-53.247s53.246 23.887 53.246 53.246c0 29.36-23.886 53.246-53.246 53.246s-53.246-23.886-53.246-53.246zm0 0" fill="#000000" opacity="1" data-original="#000000" class=""></path></g></svg>
          </a>
            
          <div class="product-chips">
          ${product.brand ? `<span class="product-brand">${product.brand}</span>` : ''}   
          ${cashbackChips}
          </div>



          <div class="prodcuts-image">
            <img src="${product.imageSrc}" alt="">
          </div>

          <span class="products-name">${product.name}</span>
          
          <div class="product-price-container">

            ${product.discount ? `<span class="product-old-price">Köhnə qiymət: ${product.price}₼</span>` : ''}
 
            ${product.discount 

            ? `<span class="product-discount-price">
                  ${product.discount}% endirimlə:
                  <span class="products-price">${product.discount ? (product.price - ((product.price) * product.discount / 100)).toFixed(2) : product.price}₼</span>
              </span>` 

            : `<span class="products-price">${product.price}₼</span>` 

            }
            
          </div>
          
          <button class="button open-add-to-card-modal"><i class="las la-cart-arrow-down"></i> Səbətə əlavə et</button>

          <input type="hidden" class="id" value="${generateRandomId()}">

        </div>
    `;
  }

  function prependProductCard(product) {
    $('.products-list').prepend(prepareProductCardTpl(product));
  }

  function appendProductCard(product) {
        return new Promise((resolve) => {
            $('.products-list').append(prepareProductCardTpl(product));
            resolve(); // Сообщаем, что элемент добавлен
        });
  }

  function insertProductCard(product) {
    $('.products-list').html(prepareProductCardTpl(product));
  }    


  function getCategoryList() {
    let selected = '';

    let groupList = {};

    $.each(products, function(key, val) {
      if(val.group) {
        if (!groupList[val.group]) {
          groupList[val.group] = [];
        }

        if(!groupList[val.group].includes(val.category)) {
          groupList[val.group].push(val.category);
        }
      } else if(!category.includes(val.category) && !val.group) {
          category.push(val.category);
      }     
    });


    category.push(groupList);




    selectedRandomCategory();
        let groupOptionList = '';


        console.log(category);

    $.each(category, function(key, val) { 
        if (typeof val === "object" && !Array.isArray(val)) { // Проверяем, что это объект
            Object.keys(val).forEach(groupKey => {
                val[groupKey].forEach(groupVal => {
                    groupOptionList += `<option class="select-category-option" ${selected} value="${groupVal}">${groupVal}</option>`;
                });

                $('.select-category').prepend(`
                  <optgroup label="${groupKey}">
                    ${groupOptionList}
                  </optgroup>
              `); 

              groupOptionList = '';  
            });

        } else {
          if(selectedCategory && val === selectedCategory) {
            selected = 'selected';
          }        
        $('.select-category').append(`
          <option class="select-category-option" ${selected} value="${val}">${val}</option>
        `);       
      }


      selected = '';
    });
  }


  function selectCategory(val) {
    if(val == 'all') {
      selectedCategory = false;
    } else {
      selectedCategory = val;
    }

    $('.select-category-option').removeAttr('selected', null);

    $('.select-category-option').each(function() {
      if($(this).attr('value').toLowerCase().trim() === val.toLowerCase().trim()) {
        $(this).prop("selected", true);
      }
    });

    $(".products-list").html('');
    resetSearchResult();
    currentIndex = 0;
    loadProducts();
  }

  function resetSearchResult() {
    $('.search-json').val('');
    customData = [];
  }

function generateRandomId() {
    let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let numbers = "0123456789";

    let randomLetters = Array.from({length: 3}, () => letters[Math.floor(Math.random() * letters.length)]).join('');
    let randomNumbers = Array.from({length: 4}, () => numbers[Math.floor(Math.random() * numbers.length)]).join('');

    return randomLetters + randomNumbers;
}

function sumCardTotal() {
  let sumCard = [];

  const targetBrands = ['Foni', 'Euroacs', 'Joyroom'];

  Object.keys(card).map(function(objectKey) {
    var row = card[objectKey];
    rowSum = parseFloat(row.productPrice) * row.count;

    sumCard.push(rowSum);

  });


  $('.sum-card').text(sumCard.reduce((partialSum, a) => partialSum + a, 0).toFixed(2)); 
}


function selectedRandomCategory() {
  selectedCategory = category[Math.floor(Math.random() * category.length)];

  if(typeof selectedCategory === 'object') {
    selectedCategory = false;
  }

}


function scrollTop() {
    var $body = $("html, body, .container, .content");

    let scrollPos = $('.content').position();

   $body.stop().animate({scrollTop: scrollPos.top}, 500, 'swing', function(evt) {
   });
}


function searchByName(name) {
  customData = products.filter(
      record => record.name.toLowerCase().includes(name) 
  );


   if(customData.length > 0) {
     selectedCategory = false;

     $(".products-list").html('');
     currentIndex = 0;
     loadProducts(customData);
   } 
}

function updateLocalStorage() {
  localStorage.setItem("orders", JSON.stringify(Object.values(card)));
}


function getOrders() {
  return savedOrder = JSON.parse(localStorage.getItem("orders"));  
}

function drawSliderItem() {
let sliderItemList = products.slice(0, 20);
    
  let itemHtml = '';

    $.each(sliderItemList, function(key, val) {
      itemHtml = itemHtml + prepareProductCardTpl(val);
    });

    $(document).find('.swiper-wrapper').html(itemHtml);

    $(document).find('.swiper-wrapper').find('.products-card').addClass('swiper-slide').removeClass('animate__animated animate__fadeIn');


    var swiper = new Swiper(".mySwiper", {
      // effect: "cards",
      grabCursor: true,
      loop: true,
      autoplay: {
        delay: 1450,
        disableOnInteraction: false,
      },
      spaceBetween: 30,
      centeredSlides: true,      
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },      
    }); 
}

});



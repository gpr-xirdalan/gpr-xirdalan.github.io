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
    let products = [];
    let category = [];
    let selectedCategory = '';
    let batchSize = 20;
    let currentIndex = 0;
    let isLoading = false;
    let searchQuery = '';
    let activeQuickFilter = 'all';
    let sortMode = 'default';
    let favorites = getFavorites();
    let latestProductKeys = new Set();
    let productMap = {};
    let recentSearches = getRecentSearches();
    let recentlyViewed = getRecentlyViewed();
    let topCategories = [];

    $.getJSON("products.json?v=177", function(data) {
      products = data.products;
      buildProductMap();
      latestProductKeys = getLatestProductKeys(products, 60);
      getCategoryList();

      drawSliderItem();
      updateCatalogMeta();
      renderRecentSearches();
      renderQuickCategories();
      renderRecentlyViewed();
      sumCardTotal();


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
        if (currentIndex < getCatalogData().length) {
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

       searchQuery = vals;
       clearTimeout($(this).data('timer'));
       renderSearchSuggestions(vals);

       if(vals.length > 0) {
         $(this).data('timer', setTimeout(function() {
            searchByName(vals);
         }, $delay));
       }

       if(!vals || vals === 'undefined') {
         searchQuery = '';
         renderCatalog();
       }
    });

    $(document).on('focus', '.search-json', function() {
      renderSearchSuggestions($(this).val().toLowerCase().trim());
      renderRecentSearches();
    });

    $(document).on('keydown', '.search-json', function(event) {
      if(event.key === 'Enter') {
        let query = $(this).val().toLowerCase().trim();

        if(query) {
          addRecentSearch(query);
          renderRecentSearches();
        }

        hideSearchSuggestions();
      }
    });

    $(document).on('click', '.clear-search', function() {
      resetSearchResult();
      activeQuickFilter = 'all';
      sortMode = 'default';
      selectedCategory = false;
      $('.select-category').val('all');
      $('.sort-products').val(sortMode);
      renderCatalog();
    });

    $(document).on('click', '.focus-search-btn', function() {
      let $search = $('.search');
      $('html, body').stop().animate({scrollTop: $search.offset().top - 10}, 300);
      $('.search-json').trigger('focus');
    });

    $(document).on('click', '.catalog-filter-btn', function() {
      activeQuickFilter = $(this).data('filter') || 'all';
      renderCatalog();
    });

    $(document).on('change', '.sort-products', function() {
      sortMode = $(this).val() || 'default';
      renderCatalog();
    });

    $(document).on('click', '.favorite-product', function(event) {
      event.preventDefault();
      event.stopPropagation();

      let productId = $(this).data('product-id') || $(this).closest('.products-card').find('.id').val();
      toggleFavorite(productId);
      updateFavoriteButtons();
      updateCatalogMeta();

      if(activeQuickFilter === 'favorites') {
        renderCatalog();
      }
    });

    $(document).on('click', '.show-viewed-filter', function() {
      activeQuickFilter = 'viewed';
      renderCatalog();
      scrollTop();
    });

    $(document).on('click', '.quick-category-chip', function() {
      let categoryValue = decodeURIComponent($(this).data('category') || 'all');
      selectCategory(categoryValue);
      scrollTop();
    });

    $(document).on('click', '.recent-search-chip', function() {
      applySearchTerm(decodeURIComponent($(this).data('search') || ''), false);
    });

    $(document).on('click', '.clear-recent-searches', function() {
      recentSearches = [];
      saveRecentSearches();
      renderRecentSearches();
      renderSearchSuggestions($('.search-json').val().toLowerCase().trim());
    });

    $(document).on('click', '.search-suggestion-item', function() {
      let suggestionType = $(this).data('type');
      let value = decodeURIComponent($(this).data('value') || '');

      if(suggestionType === 'category') {
        selectCategory(value);
        hideSearchSuggestions();
        scrollTop();
        return;
      }

      applySearchTerm(value, false);
    });

    $(document).on('click', '.recently-viewed-card', function() {
      openAddModalById($(this).data('product-id'));
    });

    $(document).on('click', '.quick-add-btn', function() {
      incrementCartProduct($(this).data('product-id'), 1, true);
    });

    $(document).on('click', '.product-qty-btn', function() {
      let productId = $(this).closest('.product-inline-cart').data('product-id');
      let delta = $(this).data('delta') === 'minus' ? -1 : 1;
      incrementCartProduct(productId, delta, delta > 0);
    });

    $(document).on('click', '.product-preview-trigger', function() {
      openAddModalById($(this).closest('.products-card').data('product-id') || $(this).data('product-id'));
    });

    $(document).on('click', function(event) {
      if(!$(event.target).closest('.search').length) {
        hideSearchSuggestions();
      }
    });


    $(document).on('change', '.select-category', function() {
      let val = $(this).val();

      selectCategory(val);

      scrollTop();
    });


    $(document).on('click', '.open-add-to-card-modal', function() {
        let $this = $(this).closest('.products-card');
        openAddModalById($this.data('product-id') || $this.find('.id').val());
    });


    $(document).on('click', '.add-to-card', function() {
        closeAddOrderModal();
        let $this = $(this).closest('.add-to-card-modal');

        let imageSrc = $this.find('.cart-product-image > img').attr('src');
        let productName = $this.find('.card-product-name').text();
        let productPrice = $this.find('.cart-product-price').text();
        let count = $this.find('.count').val();
        let brand = $this.find('.cart-brand').val();


        if(!count || count <=0) {
          count = 1;
        }

        let getId = $this.find('.cart-id').val();
        let modalProduct = getProductById(getId);

        if(modalProduct) {
          setCartProductCount(getId, count, false);
        } else {
          card[getId] = {
            "imageSrc": imageSrc,
            "productName": productName,
            "productPrice": productPrice,
            "count": count,
            "getId": getId,
            "brand": brand
          };
          updateLocalStorage();
          sumCardTotal();
          syncProductCardStates();
        }

        $('.count').val('');

        showNotice('Elave olundu');
    });


    $(document).on('click', '.close-add-card-modal', function() {
      closeAddOrderModal();
    });


    $(document).on('click', '.close-card-list', function() {
      closeCart();
    });




    $(document).on('click', '.openCart', function() {
      openCart();
      renderCartList();
    });

    function renderCartList() {
      let savedOrder = getOrders();
      $('.cart-list').html('');

      if(!savedOrder || Object.keys(savedOrder).length === 0) {
        showEmptyCart();
        return;
      }


      // {imageSrc: '/img/3.jpg', productName: '3 Qulaqlıq BT Euroacs EU-HS30 Black', productPrice: '0.60₼', count: '23', getId: 'SSW3767'}
      Object.keys(savedOrder).map(function(objectKey) {
          var row = savedOrder[objectKey];

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
                    <div class="cart-quantity-control">
                      <button type="button" class="cart-qty-btn cart-qty-minus">-</button>
                      <input type="number" min="1" class="input cart-list-item-count" value="${row.count}">
                      <button type="button" class="cart-qty-btn cart-qty-plus">+</button>
                    </div>

                    <div class="ssd">

                      <p class="sum">
                         <span class="sum-title">Toplam:</span> 
                        <span class="cart-list-item-total">${sumItemTotal(row.count, row.productPrice)} AZN</span> 
                      </p>
                    </div>


                  </div>

                  <input type="hidden" class="cart-list-item-id" value="${row.getId}">
               </div>
            </div>
          `);
      });
    }

    function showEmptyCart() {
      $('.cart-list').html(`
        <div class="cart-empty">
          <i class="las la-shopping-basket"></i>
          <span>Sebet bosdur</span>
          <small>Mehsul secib bura elave edin.</small>
        </div>
      `);
    }

    $(document).on('click', '.delete-product-at-card', function() {
       let id = $(this).closest('.cart-list-info').find('.cart-list-item-id').val();

       delete card[id];

       $(this).closest('.cart-list-item').remove();

       sumCardTotal();
       updateLocalStorage();
       syncProductCardStates();

       if(Object.values(card).filter(Boolean).length === 0) {
         showEmptyCart();
       }
    });

    $(document).on('click', '.clear-cart', function() {
      card = [];
      updateLocalStorage();
      sumCardTotal();
      syncProductCardStates();
      showEmptyCart();
      showNotice('Sebet temizlendi');
    });


    $(document).on('click', '.send-cart', function() {
      let strs = '';
      let orderId = Date.now();

      if(Object.values(card).filter(Boolean).length === 0) {
        showNotice('Sebet bosdur');
        showEmptyCart();
        return;
      }

        // **Тестируем**
      order = {
          id: orderId,
          card: []
      };


      Object.keys(card).map(function(objectKey, index) {
          var row = card[objectKey];
          let orderRow = {
            ...row,
            productPrice: `${normalizePriceValue(row.productPrice).toFixed(2)} AZN`
          };

          strs = strs + `${row.productName} - ${row.count} eded \n \n`;

          order.card.push(orderRow);
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
            syncProductCardStates();
          }
        });
    });


    function closeAddOrderModal() {
      $('.add-to-card-modal').removeClass('display-flex');
      $('body').removeClass('overflow-hidden');
    } 

    function openAddOrderModal() {
      history.pushState({ modalOpen: true }, '');      
      $('.add-to-card-modal').addClass('display-flex');
    }

    $(document).on('click', '.cart-qty-btn', function() {
       let $input = $(this).closest('.cart-quantity-control').find('.cart-list-item-count');
       let currentCount = parseInt($input.val(), 10) || 1;

       if($(this).hasClass('cart-qty-plus')) {
         currentCount += 1;
       } else {
         currentCount -= 1;
       }

       $input.val(Math.max(currentCount, 1)).trigger('input');
    });

    $(document).on('input', '.cart-list-item-count', function() {
       let $delay = 450;
       let getId = $(this).closest('.cart-list-item').find('.cart-list-item-id').val();
       let newCount = Math.max(parseInt($(this).val(), 10) || 1, 1);

       $(this).val(newCount);

       if(!card[getId]) {
         return;
       }

       card[getId].count = newCount;
       sumCardTotal();

       clearTimeout($(this).data('timer'));
      
       $(this).data('timer', setTimeout(function(){
         updateLocalStorage();
         syncProductCardStates();
       }, $delay));



       $(this).closest('.cart-list-item').find('.cart-list-item-total').html(`${sumItemTotal(newCount, card[getId].productPrice)} AZN`);

    });


  function sumItemTotal(count, price) {
    return (Math.max(parseInt(count, 10) || 1, 1) * normalizePriceValue(price)).toFixed(2);
  }


  function loadProducts() {
    let filtredData = getCatalogData();
    let emptyTitle = 'Netice tapilmadi';
    let emptyText = 'Axtarisi, kategoriyani ve ya filtri deyisin.';

    if(activeQuickFilter === 'favorites') {
      emptyTitle = 'Favorit mehsul yoxdur';
      emptyText = 'Urek duymesine toxunun, mehsul burada gorunsun.';
    }

    if(activeQuickFilter === 'viewed') {
      emptyTitle = 'Baxilan mehsul yoxdur';
      emptyText = 'Mehsulu acin, sonra burada tez tapacaqsiniz.';
    }

    updateCatalogMeta(filtredData.length);

    if(filtredData.length === 0) {
      $('.products-list').html(`
        <div class="catalog-empty">
          <i class="las la-search"></i>
          <span>${emptyTitle}</span>
          <small>${emptyText}</small>
        </div>
      `);
      isLoading = false;
      return;
    }

    if (currentIndex >= filtredData.length) {
      isLoading = false;
      return;
    }

    let endIndex = Math.min(currentIndex + batchSize, filtredData.length);

    let batch = filtredData.slice(currentIndex, endIndex);

    let promises = [];

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

  function renderCardOrderControl(productId) {
    let cartItem = card[productId];
    let cartCount = cartItem ? Math.max(parseInt(cartItem.count, 10) || 1, 1) : 0;

    if(cartCount > 0) {
      return `
        <div class="card-order-tools active">
          <div class="product-inline-cart" data-product-id="${productId}">
            <button type="button" class="product-qty-btn" data-delta="minus">-</button>
            <span class="product-inline-count">${cartCount} eded</span>
            <button type="button" class="product-qty-btn" data-delta="plus">+</button>
          </div>
          <button type="button" class="card-secondary-btn open-add-to-card-modal">Say sec</button>
        </div>
      `;
    }

    return `
      <div class="card-order-tools">
        <button type="button" class="button quick-add-btn" data-product-id="${productId}">
          <i class="las la-bolt"></i>
          <span>1 toxunusla elave et</span>
        </button>
        <button type="button" class="card-secondary-btn open-add-to-card-modal">Say sec</button>
      </div>
    `;
  }



  function prepareProductCardTpl(product) {
    const productId = getProductKey(product);
    const isFavorite = favorites.includes(productId);

    let cashbackChips = ''
    let hasNewChips = '';

    if(product.addedDate) {
      var toDay = new Date();

      let currentDate = `${toDay.getDate()}.${toDay.getMonth() + 1}.${toDay.getFullYear()}`;

      if(getDateDiff(currentDate, product.addedDate) < 7 || isLatestProduct(product)) {
        hasNewChips = `<span class="cashback-chips">NEW</span>`; 
      }
    }

    if(!hasNewChips && isLatestProduct(product)) {
      hasNewChips = `<span class="cashback-chips">NEW</span>`;
    }


    // let urlParse = encodeURIComponent(product.name);
    return `
        <div class="products-card animate__animated animate__fadeIn" data-product-id="${productId}">
          <a href="javascript:void(0)" class="share" data-name="${product.name}">
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" x="0" y="0" viewBox="0 0 512 512.001" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><path d="M361.824 344.395c-24.531 0-46.633 10.593-61.972 27.445l-137.973-85.453A83.321 83.321 0 0 0 167.605 256a83.29 83.29 0 0 0-5.726-30.387l137.973-85.457c15.34 16.852 37.441 27.45 61.972 27.45 46.211 0 83.805-37.594 83.805-83.805C445.629 37.59 408.035 0 361.824 0c-46.21 0-83.804 37.594-83.804 83.805a83.403 83.403 0 0 0 5.726 30.386l-137.969 85.454c-15.34-16.852-37.441-27.45-61.972-27.45C37.594 172.195 0 209.793 0 256c0 46.21 37.594 83.805 83.805 83.805 24.53 0 46.633-10.594 61.972-27.45l137.97 85.454a83.408 83.408 0 0 0-5.727 30.39c0 46.207 37.593 83.801 83.804 83.801s83.805-37.594 83.805-83.8c0-46.212-37.594-83.805-83.805-83.805zm-53.246-260.59c0-29.36 23.887-53.246 53.246-53.246s53.246 23.886 53.246 53.246c0 29.36-23.886 53.246-53.246 53.246s-53.246-23.887-53.246-53.246zM83.805 309.246c-29.364 0-53.25-23.887-53.25-53.246s23.886-53.246 53.25-53.246c29.36 0 53.242 23.887 53.242 53.246s-23.883 53.246-53.242 53.246zm224.773 118.95c0-29.36 23.887-53.247 53.246-53.247s53.246 23.887 53.246 53.246c0 29.36-23.886 53.246-53.246 53.246s-53.246-23.886-53.246-53.246zm0 0" fill="#000000" opacity="1" data-original="#000000" class=""></path></g></svg>
          </a>
          <button type="button" class="favorite-product ${isFavorite ? 'active' : ''}" data-product-id="${productId}" aria-label="Favorit">
            <i class="${isFavorite ? 'las' : 'lar'} la-heart"></i>
          </button>
            
          <div class="product-chips">
          ${product.brand ? `<span class="product-brand">${product.brand}</span>` : ''}   
          ${cashbackChips}
          ${hasNewChips}
          </div>



          <div class="prodcuts-image product-preview-trigger" data-product-id="${productId}">
            <img src="${product.imageSrc}" alt="">
          </div>

          <span class="products-name product-preview-trigger" data-product-id="${productId}">${product.name}</span>
          
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
          
          ${renderCardOrderControl(productId)}

          <input type="hidden" class="id" value="${productId}">

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

  function buildProductMap() {
    productMap = {};

    $.each(products, function(_, product) {
      productMap[getProductKey(product)] = product;
    });
  }

  function getProductById(productId) {
    return productMap[productId] || null;
  }

  function getCategoryStats() {
    let stats = {};

    $.each(products, function(_, product) {
      let categoryName = String(product.category || '').trim();

      if(!categoryName) {
        return;
      }

      stats[categoryName] = (stats[categoryName] || 0) + 1;
    });

    return Object.keys(stats)
      .map(name => ({ name: name, count: stats[name] }))
      .sort((a, b) => b.count - a.count);
  }

  function renderQuickCategories() {
    let chips = ['<button type="button" class="quick-category-chip ' + (!selectedCategory ? 'active' : '') + '" data-category="all">Hamisi</button>'];

    $.each(topCategories, function(_, item) {
      let isActive = normalizeText(selectedCategory) === normalizeText(item.name);
      chips.push(`
        <button type="button" class="quick-category-chip ${isActive ? 'active' : ''}" data-category="${encodeURIComponent(item.name)}">
          <span>${item.name}</span>
          <small>${item.count}</small>
        </button>
      `);
    });

    $('.quick-categories').html(chips.join(''));
  }

  function openAddModalById(productId) {
    let product = getProductById(productId);

    if(!product) {
      return;
    }

    addViewedProduct(productId);
    openAddOrderModal();

    $('.cart-product-image > img').attr('src', product.imageSrc);
    $('.card-product-name').text(product.name);
    $('.cart-product-price').text(formatMoney(getProductPrice(product)));
    $('.cart-brand').val(product.brand || '');
    $('.cart-id').val(productId);
    $('.count').val(card[productId] ? card[productId].count : 1).trigger('focus');
    $('body').addClass('overflow-hidden');
  }

  function createCartItem(product, count) {
    return {
      imageSrc: product.imageSrc,
      productName: product.name,
      productPrice: formatMoney(getProductPrice(product)),
      count: Math.max(parseInt(count, 10) || 1, 1),
      getId: getProductKey(product),
      brand: product.brand || ''
    };
  }

  function setCartProductCount(productId, count, notifyUser) {
    let product = getProductById(productId);
    let normalizedCount = Math.max(parseInt(count, 10) || 0, 0);

    if(!product) {
      return;
    }

    if(normalizedCount <= 0) {
      delete card[productId];
    } else {
      card[productId] = createCartItem(product, normalizedCount);
    }

    updateLocalStorage();
    sumCardTotal();
    syncProductCardStates();

    if($('.cart-list-modal').hasClass('active')) {
      renderCartList();
    }

    if(notifyUser) {
      showNotice(normalizedCount > 0 ? 'Elave olundu' : 'Mehsul silindi');
    }
  }

  function incrementCartProduct(productId, delta, notifyUser) {
    let currentCount = card[productId] ? Math.max(parseInt(card[productId].count, 10) || 1, 1) : 0;
    setCartProductCount(productId, currentCount + delta, notifyUser);
  }

  function syncProductCardStates() {
    $('.products-card').each(function() {
      let productId = $(this).data('product-id') || $(this).find('.id').val();
      $(this).find('.card-order-tools').replaceWith(renderCardOrderControl(productId));
    });
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
    topCategories = getCategoryStats().slice(0, 12);




    selectedCategory = false;
        let groupOptionList = '';

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

    resetSearchResult();
    renderCatalog();
  }

  function resetSearchResult() {
    $('.search-json').val('');
    searchQuery = '';
    hideSearchSuggestions();
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
  let productCount = 0;

  Object.keys(card).map(function(objectKey) {
    var row = card[objectKey];
    if(!row) {
      return;
    }

    let rowCount = Math.max(parseInt(row.count, 10) || 1, 1);
    let rowSum = normalizePriceValue(row.productPrice) * rowCount;
    productCount += rowCount;

    sumCard.push(rowSum);

  });


  $('.sum-card').text(sumCard.reduce((partialSum, a) => partialSum + a, 0).toFixed(2)); 
  $('.cart-count-badge').text(productCount).toggleClass('active', productCount > 0);
  $('.mobile-cart-summary').toggleClass('active', productCount > 0);
  $('.mobile-cart-summary-text').text(productCount > 0 ? `Sebetde ${productCount} mehsul` : 'Sebet bosdur');
  $('.mobile-cart-summary-total').text(`${sumCard.reduce((partialSum, a) => partialSum + a, 0).toFixed(2)} AZN`);
}


function selectedRandomCategory() {
  selectedCategory = category[Math.floor(Math.random() * category.length)];

  if(typeof selectedCategory === 'object') {
    selectedCategory = false;
  }

}

function renderCatalog() {
  $(".products-list").html('');
  currentIndex = 0;
  isLoading = false;
  loadProducts();
}

function getCatalogData() {
  let filtredData = products.slice();

  if(selectedCategory) {
    filtredData = filtredData.filter(item => normalizeText(item.category) == normalizeText(selectedCategory));
  }

  if(searchQuery) {
    filtredData = filtredData.filter(item => productMatchesSearch(item, searchQuery));
  }

  if(activeQuickFilter === 'discount') {
    filtredData = filtredData.filter(item => getProductDiscount(item) > 0);
  }

  if(activeQuickFilter === 'latest') {
    filtredData = filtredData.filter(item => isLatestProduct(item));
  }

  if(activeQuickFilter === 'favorites') {
    filtredData = filtredData.filter(item => favorites.includes(getProductKey(item)));
  }

  if(activeQuickFilter === 'viewed') {
    filtredData = filtredData.filter(item => recentlyViewed.includes(getProductKey(item)));
  }

  return sortProducts(filtredData);
}

function productMatchesSearch(product, query) {
  let normalizedQuery = normalizeText(query);
  let searchable = [
    product.name,
    product.category,
    product.brand
  ].map(normalizeText).join(' ');

  return searchable.includes(normalizedQuery);
}

function sortProducts(list) {
  let sorted = list.slice();

  if(activeQuickFilter === 'latest' && sortMode === 'default') {
    return sorted.sort((a, b) => parseProductDate(b.addedDate) - parseProductDate(a.addedDate));
  }

  switch(sortMode) {
    case 'newest':
      return sorted.sort((a, b) => parseProductDate(b.addedDate) - parseProductDate(a.addedDate));
    case 'cheap':
      return sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    case 'expensive':
      return sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    case 'discount':
      return sorted.sort((a, b) => getProductDiscount(b) - getProductDiscount(a));
    default:
      return sorted;
  }
}

function getProductPrice(product) {
  let price = normalizePriceValue(product.price);
  let discount = getProductDiscount(product);

  if(discount > 0) {
    return price - (price * discount / 100);
  }

  return price;
}

function getProductDiscount(product) {
  return normalizePriceValue(product.discount);
}

function formatMoney(value) {
  return `${normalizePriceValue(value).toFixed(2)} AZN`;
}

function normalizePriceValue(value) {
  let parsed = parseFloat(String(value || '').replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function parseProductDate(value) {
  if(!value) {
    return 0;
  }

  let parts = String(value).split('.').map(Number);

  if(parts.length !== 3) {
    return 0;
  }

  return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
}

function getLatestProductKeys(productList, limit) {
  return new Set(productList
    .slice()
    .sort((a, b) => parseProductDate(b.addedDate) - parseProductDate(a.addedDate))
    .slice(0, limit)
    .map(getProductKey)
  );
}

function isLatestProduct(product) {
  return latestProductKeys.has(getProductKey(product)) || product.hasNew === true;
}

function getProductKey(product) {
  let source = `${product.name || ''}|${product.imageSrc || ''}|${product.category || ''}`;
  let hash = 0;

  for(let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i);
    hash |= 0;
  }

  return `p${Math.abs(hash).toString(36)}` || generateRandomId();
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favoriteProducts')) || [];
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem('favoriteProducts', JSON.stringify(favorites));
}

function toggleFavorite(productId) {
  if(!productId) {
    return;
  }

  if(favorites.includes(productId)) {
    favorites = favorites.filter(item => item !== productId);
    showNotice('Favoritden silindi');
  } else {
    favorites.push(productId);
    showNotice('Favoritlere elave olundu');
  }

  saveFavorites();
}

function updateFavoriteButtons() {
  $('.favorite-product').each(function() {
    let productId = $(this).data('product-id');
    let isFavorite = favorites.includes(productId);

    $(this).toggleClass('active', isFavorite);
    $(this).find('i').attr('class', `${isFavorite ? 'las' : 'lar'} la-heart`);
  });
}

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem('recentSearches')) || [];
  } catch (error) {
    return [];
  }
}

function saveRecentSearches() {
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
}

function addRecentSearch(query) {
  let normalizedQuery = normalizeText(query);

  if(!normalizedQuery || normalizedQuery.length < 2) {
    return;
  }

  recentSearches = recentSearches.filter(item => item !== normalizedQuery);
  recentSearches.unshift(normalizedQuery);
  recentSearches = recentSearches.slice(0, 8);
  saveRecentSearches();
}

function renderRecentSearches() {
  if(!recentSearches.length) {
    $('.recent-searches').html('');
    return;
  }

  $('.recent-searches').html(`
    <div class="recent-searches-head">
      <span class="recent-searches-title">Son axtarislar</span>
      <button type="button" class="clear-recent-searches">Temizle</button>
    </div>
    <div class="recent-searches-list">
      ${recentSearches.map(item => `<button type="button" class="recent-search-chip" data-search="${encodeURIComponent(item)}">${item}</button>`).join('')}
    </div>
  `);
}

function renderSearchSuggestions(query) {
  let normalizedQuery = normalizeText(query);
  let suggestionHtml = [];

  if(!normalizedQuery) {
    if(recentSearches.length) {
      suggestionHtml.push(`<div class="search-suggestion-group"><span class="search-suggestion-title">Son axtarislar</span>${recentSearches.slice(0, 4).map(item => `<button type="button" class="search-suggestion-item" data-type="search" data-value="${encodeURIComponent(item)}"><i class="las la-history"></i><span>${item}</span></button>`).join('')}</div>`);
    }
  } else {
    let matchedProducts = products.filter(product => productMatchesSearch(product, normalizedQuery)).slice(0, 5);
    let matchedCategories = getCategoryStats().filter(item => normalizeText(item.name).includes(normalizedQuery)).slice(0, 4);

    if(matchedProducts.length) {
      suggestionHtml.push(`
        <div class="search-suggestion-group">
          <span class="search-suggestion-title">Mehsullar</span>
          ${matchedProducts.map(product => `<button type="button" class="search-suggestion-item" data-type="search" data-value="${encodeURIComponent(product.name)}"><img src="${product.imageSrc}" alt=""><span>${product.name}</span></button>`).join('')}
        </div>
      `);
    }

    if(matchedCategories.length) {
      suggestionHtml.push(`
        <div class="search-suggestion-group">
          <span class="search-suggestion-title">Kateqoriyalar</span>
          ${matchedCategories.map(item => `<button type="button" class="search-suggestion-item" data-type="category" data-value="${encodeURIComponent(item.name)}"><i class="las la-stream"></i><span>${item.name}</span><small>${item.count}</small></button>`).join('')}
        </div>
      `);
    }
  }

  $('.search-suggestions')
    .html(suggestionHtml.join(''))
    .toggleClass('active', suggestionHtml.length > 0);
}

function hideSearchSuggestions() {
  $('.search-suggestions').removeClass('active').html('');
}

function applySearchTerm(term, skipHistory) {
  let normalizedTerm = normalizeText(term);

  if(!normalizedTerm) {
    return;
  }

  $('.search-json').val(normalizedTerm);
  searchByName(normalizedTerm);

  if(!skipHistory) {
    addRecentSearch(normalizedTerm);
    renderRecentSearches();
  }

  hideSearchSuggestions();
  scrollTop();
}

function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem('recentlyViewedProducts')) || [];
  } catch (error) {
    return [];
  }
}

function saveRecentlyViewed() {
  localStorage.setItem('recentlyViewedProducts', JSON.stringify(recentlyViewed));
}

function addViewedProduct(productId) {
  if(!productId) {
    return;
  }

  recentlyViewed = recentlyViewed.filter(item => item !== productId);
  recentlyViewed.unshift(productId);
  recentlyViewed = recentlyViewed.slice(0, 10);
  saveRecentlyViewed();
  renderRecentlyViewed();
}

function renderRecentlyViewed() {
  let viewedProducts = recentlyViewed.map(getProductById).filter(Boolean).slice(0, 8);

  if(!viewedProducts.length) {
    $('.recently-viewed-section').addClass('hide');
    $('.recently-viewed-list').html('');
    return;
  }

  $('.recently-viewed-section').removeClass('hide');
  $('.recently-viewed-list').html(viewedProducts.map(product => `
    <button type="button" class="recently-viewed-card" data-product-id="${getProductKey(product)}">
      <span class="recently-viewed-thumb"><img src="${product.imageSrc}" alt=""></span>
      <span class="recently-viewed-name">${product.name}</span>
      <span class="recently-viewed-price">${formatMoney(getProductPrice(product))}</span>
    </button>
  `).join(''));
}

function updateCatalogMeta(total) {
  let resultCount = typeof total === 'number' ? total : getCatalogData().length;

  $('.results-summary').text(`${resultCount} mehsul gosterilir`);
  $('.favorite-count').text(favorites.length);
  $('.catalog-filter-btn').removeClass('active');
  $(`.catalog-filter-btn[data-filter="${activeQuickFilter}"]`).addClass('active');
  renderQuickCategories();
}

function showNotice(message) {
  $('.notice').text(message);
  $('.showNotice').addClass('active');

  setTimeout(function(){
    $('.showNotice').removeClass('active');
  }, 1200);
}


function scrollTop() {
    var $body = $("html, body, .container, .content");

    let scrollPos = $('.content').position();

   $body.stop().animate({scrollTop: scrollPos.top}, 500, 'swing', function(evt) {
   });
}


function searchByName(name) {
  searchQuery = name;
  selectedCategory = false;
  $('.select-category').val('all');
  renderCatalog();
}

function updateLocalStorage() {
  localStorage.setItem("orders", JSON.stringify(Object.values(card).filter(Boolean)));
}


function getOrders() {
  try {
    return JSON.parse(localStorage.getItem("orders")) || [];
  } catch (error) {
    return [];
  }
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

  function openCart() {
    $('body').addClass('overflow-hidden');

    history.pushState({ modalOpen: true }, ''); 

    $('.cart-list').html('');
    $('.cart-list-modal').addClass(['display-flex', 'active']);
    $('.bottom-contol').addClass('hide-bottom-control');   
  }

  function closeCart() {
    $('.cart-list-modal').removeClass(['display-flex', 'active']);
    $('body').removeClass('overflow-hidden');    
    $('.bottom-contol').removeClass('hide-bottom-control');   
  }    


  window.addEventListener('popstate', function (event) {
    if ($('.cart-list-modal').hasClass('active')) {
      closeCart(); 
      history.pushState(null, ''); 
      return;
    }

    if ($('.add-to-card-modal').hasClass('display-flex')) {
      closeAddOrderModal();
      history.pushState(null, ''); 
      return;
    }

     history.back();
  });


    const select = document.getElementById('categorySelect'); 
  $('.opencategory').click(function() {
    // select.style.opacity = '1';
    // select.style.pointerEvents = 'auto';
    // select.style.position = 'fixed';
    // select.style.left = '-9999px';

    $('.select-category').focus();
    $('.select-category').trigger('click');
  });



function getDateDiff(date1, date2) {
  // Преобразуем строки формата 10.10.2025 → Date
  const [day1, month1, year1] = date1.split('.').map(Number);
  const [day2, month2, year2] = date2.split('.').map(Number);

  const d1 = new Date(year1, month1 - 1, day1);
  const d2 = new Date(year2, month2 - 1, day2);

  // Разница в миллисекундах
  const diffMs = Math.abs(d2 - d1);

  // Переводим в дни
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}    


function openFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.mozRequestFullScreen) { // Firefox
    document.documentElement.mozRequestFullScreen();
  } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari and Opera
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
    document.documentElement.msRequestFullscreen();
  }
}


});

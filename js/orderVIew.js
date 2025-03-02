  function sumItemTotal(count, price) {
    price = price.replace('AZN', '');
    return (count * price).toFixed(2);
  }


	let orderList = [];
	let filterdList = [];

	const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

	$.getJSON(`https://raw.githubusercontent.com/gpr-xirdalan/gpr-xirdalan.github.io/refs/heads/main/order.json?v=${Date.now()}`, 
	function(data) {

		filtredList = data.filter(item => item.id == orderId);
 
	    $.each(filtredList, function(key, val) {
	      val.card.map(function(key) {
	      	appendOrderView(key);
	      });
	    });

    });


    function appendOrderView(row) {
	      $('.cart-list').append(`
            <div class="cart-list-item">
               <div class="cart-list-image" style="width: 170px; height: 170px;">
                <img src="${row.imageSrc}">
               </div>

               <div class="cart-list-info">
                  <span class="cart-list-item-name">${row.productName}</span>
                  <span class="cart-list-item-productPrice">${row.productPrice}</span>

                  <div class="cart-list-info-count-group">
                    <span class="cart-label">Say:</span>
                    <span class="orderViewCount">${row.count} ədəd</span>
                    
                    <p class="sum">
                         <span class="sum-title">Toplam: </span> 
                        <span class="cart-list-item-total">${sumItemTotal(row.count, row.productPrice)}₼</span> 
                      </p>
                  </div>

                  <input type="hidden" class="cart-list-item-id" value="${row.getId}">
               </div>
            </div>
          `);    	
    }
  function sumItemTotal(count, price) {
    price = price.replace('AZN', '');
    return (count * price).toFixed(2);
  }


    $.ajax({
        url: `https://api.github.com/repos/gpr-xirdalan/order/contents/order.json?timestamp=${Date.now()}`,
        method: "GET",
        headers: { "Accept": "application/vnd.github.v3.raw" },
        success: function(data) {
            let orderList = [];
            let filterdList = [];

            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('orderId');            
            let datas =  JSON.parse(data);

            // let jsonString = atob(data.content);
            // let jsonContent = JSON.parse(jsonString); // Преобразуем в объект
            // let filtredList = datas.find(item => item.id == orderId);
             Object.keys(datas).map(function(objectKey, index) {
                let row = datas[objectKey];

                if(row.id == orderId) {
                    $.each(row.card, function(key, val) {
                        appendOrderView(val);
                    });
                }
            });


        },
        error: function(err) {
            console.error("Ошибка при загрузке JSON:", err);
        }
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
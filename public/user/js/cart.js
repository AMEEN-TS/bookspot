
function add_to_cart(proId){
    $.ajax({
        url:'/add-tocart/'+proId,
        method:'get',   
        success:(response)=>{
            if(response.status){
                Swal.fire(
                    'added to Cart!',
                    'product added to Cart.',
                    'success'
                )
                let count=$('#cart-count').html()
                counts=parseInt(count)+1
                $('#cart-count').html(counts)
                
            }else{
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Please Login!',
                    footer: '<a href="/login">Login</a>'
                  })
            }
          
            
            
        }
    })
}

function addTowishlist(proId){
    $.ajax({
        url:'/add-Towishlist/'+proId,
        method:'get',
    
        success:(response)=>{
            if(response.msg){
                addwishlist()
                // alert(response.msg)
            }
            else if (response.err){
                alreadyInWish()
             }
             else{
                firstlogedin()
            }
           
        }  
    })
}
function addwishlist() {
    Swal.fire({
        title: 'Product added to wishlist!',
        icon: 'success',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
    }).then((result) => {

    })
}
function alreadyInWish() {
    Swal.fire({
        title: 'Item already added!',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
    }).then((result) => {


    }) 
} 
function firstlogedin() {
    Swal.fire({
        title: 'PLease login first!',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'OK'
    }).then((result) => {
        location.href = '/login'

    })
}



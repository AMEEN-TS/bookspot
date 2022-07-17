// function add_to_cart(proId){
//     $.ajax({
//         url:'/add-tocart/'+proId,
//         method:'get',   
//         success:(response)=>{
//             if(response.status){
//                 let count=$('#cart-count').html()
//                 counts=parseInt(count)+1
//                 $('#cart-count').html(counts)
//             }   
//         }
//     })
// }

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
document.addEventListener("deviceready", deviceInfo, true);
function deviceInfo(){
	
}
function getPhoto(callback, source) {
	  source = source || 1;
      navigator.camera.getPicture(callback, function(){}, { quality: 50, 
        destinationType: destinationType.FILE_URI,
        sourceType: source });
}
$(function(){
	$(".take").bind("touch click", function(){
		getPhoto(function(uri){

		});
	});
});
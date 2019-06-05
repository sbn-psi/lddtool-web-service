$(document).ready(function() {
    console.log('jquery app ready.');
    
    const submitButton  = $('input[type="submit"]');
    
    submitButton.on('click', function(e) {
        // only show if a file has been selected to upload
        if ($('#file').val()) {
            $('#loading').show();
            setTimeout(function() {
                submitButton.attr('disabled',true);
            },100);
        };
    });
});
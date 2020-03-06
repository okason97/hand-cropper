var handTrack = require('handtrackjs');
var fs = require('fs');
var Cropper = require('cropperjs');
var glob = require("glob");

var myArgs = process.argv.slice(2);

if (myArgs.length >= 2){
    imagesFolder = myArgs[0]
    extensionName = myArgs[1]
}else{
    imagesFolder = './'
    extensionName = 'png'
}

const modelParams = {
//    flipHorizontal: true,   // flip e.g for video 
//    imageScaleFactor: 0.7,  // reduce input image size for gains in speed.
//    maxNumBoxes: 20,        // maximum number of boxes to detect
//    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.7,    // confidence threshold for predictions.
}

// Load the model.
handTrack.load(modelParams).then(model => {
    console.log("model loaded");
    glob(imagesFolder + "/**/*." + extensionName, function (er, files) {
        for (i in files){
            file = files[i]
            fs.readFile(file, (err, data)=>{

                //error handle
                if(err) console.log(err);
          
                //convert image file to base64-encoded string
                let base64Image = new Buffer(data, 'binary').toString('base64');

                //combine all strings
                let imgSrcString = 'data:image/' + extensionName + ';base64,' + base64Image;

                //create image
                var img = new Image();
                img.src = imgSrcString;
            })
    
            // detect objects in the image.
            model.detect(img).then(predictions => {
                console.log('Predictions: ', predictions); 
                for (prediction in predictions){
                    const cropper = new Cropper(img).setCropBoxData(prediction);
                    canvas = cropper.getCroppedCanvas();        
                    var out = fs.createWriteStream(__dirname + '/croppedHands/' + file + '.png')
                    , stream = canvas.createPNGStream();

                    stream.on('data', function(chunk){
                        out.write(chunk);
                    });

                    stream.on('end', function(){
                        console.log('saved png');
                    });
            
                }
            });
        }    
    })
});

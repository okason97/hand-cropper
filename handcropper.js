var handTrack = require('handtrackjs');
var fs = require('fs');
var glob = require("glob");
const { Image, createCanvas } = require('canvas')
var path = require('path');

var myArgs = process.argv.slice(2);
const saveDir = __dirname + '/croppedHands/';

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
    scoreThreshold: 0.8,    // confidence threshold for predictions.
}

const getCroppedCanvas = (sourceCanvas, cropBox) => {
    const destCanvas = createCanvas()
    const ctx = destCanvas.getContext('2d')
    left = cropBox[0]-sourceCanvas.width*0.15;
    if (left<0) left=0;
    top = cropBox[1]-sourceCanvas.height*0.15;
    if (top<0) top=0;
    width = cropBox[2]+sourceCanvas.width*0.3;
    height = cropBox[3]+sourceCanvas.height*0.3;
    destCanvas.width = width;
    destCanvas.height = height;
    ctx.drawImage(
        sourceCanvas,
        left,top,width,height,  // source rect with content to crop
        0,0,width,height);      // newCanvas, same size as source rect
    return destCanvas;
}

if (!fs.existsSync(saveDir)){
    fs.mkdirSync(saveDir);
}

// Load the model.
handTrack.load(modelParams).then(model => {
    console.log("model loaded");
    glob(imagesFolder + "/**/*." + extensionName, function (er, files) {
        files.forEach(file => {
            console.log(path.basename(file));                    
            fs.readFile(file, (err, data)=>{

                //error handle
                if(err) console.log(err);
          
                //convert image file to base64-encoded string
                let base64Image = new Buffer(data, 'binary').toString('base64');

                //combine all strings
                let imgSrcString = 'data:image/' + extensionName + ';base64,' + base64Image;

                //create image
                var img = new Image();
                const canvas = createCanvas()
                const ctx = canvas.getContext('2d')
                img.onload = () => {
                    canvas.width = img.width
                    canvas.height = img.height
                    console.log(canvas.width)
                    ctx.drawImage(img, 0, 0, img.width, img.height)
                    // detect objects in the image.
                    model.detect(canvas).then(predictions => {
                        console.log('Predictions: ', predictions); 
                        predictions.forEach(prediction => {
                            cropedCanvas = getCroppedCanvas(canvas, prediction.bbox);
                            var buf = cropedCanvas.toBuffer();
                            fs.writeFileSync(saveDir + path.basename(file), buf);
                            console.log('saved png to: ');
                            console.log(path.basename(file));                    
                        });
                    });
                }
                img.onerror = err => { throw err }
                img.src = imgSrcString;                
            })
        });
    })
});

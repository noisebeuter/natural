/*
Copyright (c) 2011, Chris Umbel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// expose a training function. an array of objects that look like:
// {classification: 'class name', text: 'full text of item'}
// this function must be called before performing classification.
function train(data) {
     this.docCount = data.length;
     classifier = this;
    
     // count up word occurrences for the classes of each doc
     data.forEach(function(item) {
         if(classifier.classes.indexOf(item.classification) < 0)
             classifier.classes.push(item.classification);
     
         item.text.tokenizeAndStem().forEach(function(word) {
             if(classifier.words.indexOf(word) < 0)
                 classifier.words.push(word);
             
             if(classifier.features[word])
                 if(classifier.features[word][item.classification])
                     classifier.features[word][item.classification]++;
                 else
                     classifier.features[word][item.classification] = 1;
             else {
                 classifier.features[word] = {};
                 classifier.features[word][item.classification] = 1;
             }
         });
     });
     
     // determine the probability of each word for each class
     this.words.forEach(function(word) {
         classifier.classes.forEach(function(classification) {
             if(classifier.features[word][classification]) {
                 classifier.features[word][classification] = classifier.features[word][classification] / classifier.docCount;
             }
         });
     });
};

// expose a classification function. here's the money. general full text is
// supplied and the classification is returned.
function classify(text) {
     classifications = {};
     classifier = this;
     
     if(text instanceof Array)
         tokens = text;
     else
         tokens = text.tokenizeAndStem();
          
     // determine the probability that the given document matches each class
     tokens.forEach(function(word) {        
         if(classifier.features[word]) {
             classifier.classes.forEach(function(classification) {
                 // zero would short-circuit the whole operation. don't let that
                 // happen by using a multiplier approaching, but not equal to 0
                 // for a non-match.
                 if(!classifier.features[word][classification])                
                     classifier.features[word][classification] = 0.0001;
     
                 if(classifications[classification])
                     classifications[classification] *= classifier.features[word][classification];
                 else
                     classifications[classification] = classifier.features[word][classification];
             });
         }
     });
     
     result = {className : "", value : null};
     
     // find the class with the highest probability
     this.classes.forEach(function(classification) {
         if(classifications[classification] >= result.value) {
             result.value = classifications[classification];
             result.className = classification;
         }
     });
     
     return result.className;
}

function BayesClassifier(stemmer) {
     this.features = {};
     this.classes = [];
     this.words = [];
     this.docCount = 0.0;
     this.train = train;
     this.classify = classify;
     
     // if the caller specified a stemmer use that
     if(stemmer)
          stemmer.attach();
     // if the caller didn't specify a stemmer and one isn't attached
     // use porter as a default
     else if(!String.prototype.tokenizeAndStem)
          require('./porter_stemmer').attach();
}

module.exports = BayesClassifier;
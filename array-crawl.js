(() => {

    const NUM_CPU = require('os').cpus().length;

    /**
        Usage example
        let data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
        data.crawl()
            .onItem((item, index, ack) => {
                console.log('item', item);
                if(index==10){
                    ack(false); // ask for interruption
                } else {
                    setTimeout(() => {
                        ack();
                    }, 200+Math.floor(Math.random()*1000));
                }
            })
            .onComplete((interruptedat) => {
                console.log('complete', interruptedat);
            })        
     */
    function __crawl(parallelize){

        let list = this;
        if(!(list instanceof Array)){ throw 'list must be an array'; }
        parallelize = typeof parallelize!='number' ? NUM_CPU : Math.min(Math.max(Math.floor(parallelize), 1), NUM_CPU);
    
        let onItem      = null;
        let onComplete  = null;
        let processing  = 0;
        let interrupted = false;
        let running     = false;
        let index       = 0;
        let ended       = false;
    
        function run(){
            if(!running){
                running = true;
                if(index>=list.length){
                    if(processing==0 && ended===false){
                        ended = true;
                        onComplete(false);
                    }
                } else {
                    while(index<list.length && processing<parallelize && interrupted===false){
                        ((localindex) => {
                            onItem(list[localindex], localindex, (interrupt) => {
                                if(interrupt===false){
                                    if(interrupted==false){
                                        interrupted     = true;
                                        interruptedat   = localindex;
                                        index           = list.length;
                                        onComplete(interruptedat);
                                        return false;
                                    }
                                } else {
                                    processing--;
                                    if(interrupted===false){
                                        process.nextTick(() => {
                                            running = false;
                                            run();
                                        });
                                    }
                                }
                            });
                        })(index);
                        processing++;
                        index++;
                    }
                }
        
            }
        }
    
        // return promise
        let promise = {
            onItem: (callback) => {
                if(typeof callback!='function'){
                    throw 'onitem require function'
                } else {
                    onItem = callback;
                    if(onItem!=null && onComplete!=null){ run(); }
                }
                return promise;
            },
            onComplete: (callback) => {
                if(typeof callback!='function'){
                    throw 'onComplete require function'
                } else {
                    onComplete = callback;
                    if(onItem!=null && onComplete!=null){ run(); }
                }
                return promise;
            }
        }
        return promise;
    }

    Object.defineProperties(
        Array.prototype,
        {
            crawl: {
                value       : __crawl,
                writable    : false,
                enumerable  : false,
                configurable: false
            }
        }
    );

})();
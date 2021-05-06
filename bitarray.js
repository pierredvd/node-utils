module.exports = (() => {

    function BitArray(bitLength){

        var __this  = this;
        var __bytes = null;

        function    __construct(bitLength){
            let i           = 0;
            let properties  = {};
            let byteLength  = Math.floor(bitLength/8)+((bitLength%8)>0?1:0);
            __bytes = Buffer.alloc(byteLength);
            for(i=0; i<bitLength; i++){
                ((index) => {
                    properties[index] = {
                        get: ()  => { return __getBit(index)    },
                        set: (v) => { return __setBit(index, v) },
                        configurable: false,
                        enumerable  : true
                    }
                })(i);
            }
            properties = Object.assign(properties, {
                length  : { value:  bitLength, writable: false, configurable: false, enumerable: true },
                forEach : { value: __forEach , writable: false, configurable: false, enumerable: true },
                map     : { value: __map     , writable: false, configurable: false, enumerable: true },
                fill    : { value: __fill    , writable: false, configurable: false, enumerable: true },
                copy    : { value: __copy    , writable: false, configurable: false, enumerable: true },
                reverse : { value: __reverse , writable: false, configurable: false, enumerable: true },
                slice   : { value: __slice   , writable: false, configurable: false, enumerable: true },
                toBuffer: { value: __toBuffer, writable: false, configurable: false, enumerable: true },
                toArray : { value: __toArray , writable: false, configurable: false, enumerable: true },
                toNumber: { value: __toNumber, writable: false, configurable: false, enumerable: true }
            });
            Object.defineProperties(__this, properties);
        }
    
        function    __getBit(index){
            let bitIndex    = index % 8;
            let byteIndex   = ((index - bitIndex)>>3);
            let mask        = (1 << (7-bitIndex));
            return !((__bytes[byteIndex] & mask)===0);
        }
        function    __setBit(index, value){
            value = (value===true);
            let bitIndex    = index % 8;
            let byteIndex   = ((index - bitIndex)>>3);
            let mask        = (1 << (7-bitIndex));
            __bytes[byteIndex] = __bytes[byteIndex] & (255-mask);
            if(value){ __bytes[byteIndex] = __bytes[byteIndex] | mask; }
            return __this;
        }

        function    __fill(value){
            let i = 0;
            let l = __bytes.byteLength;
            let f = value===true ? 255 : 0;
            for(i=0; i<l; i++){
                __bytes[i] = f;
            }
            return __this;
        }
        function    __map(callback){
            let i = 0;
            let l = __this.length;
            for(i=0; i<l; i++){
                __this[i] = (callback(__this[i], i, this)===true);
            }
            return this;
        }
        function    __forEach(callback){
            let i = 0;
            let l = __this.length;
            for(i=0; i<l; i++){
                callback(__this[i], i, this);
            }
            return this;
        }
        function    __slice(start, end){
            start = Math.min(Math.max(start, 0), __this.length-1);
            if(end<0){ end = __this.length+end; }
            end = Math.min(Math.max(end, 0), __this.length-1);
            let buffer = 0;
            if(start >= end){
                buffer  = start;
                start   = end;
                end     = buffer;
            }
            let bitLength = end-start;
            let bitarr = BitArray.alloc(bitLength);
            if(bitLength>0){
                __this.forEach((v, i) => {
                    if(i>=start && i<end){
                        bitarr[i-start] = v;
                    }
                });
            }
            return bitarr;
        }
        function    __copy(){
            let b = new BitArray(__this.length);
            __forEach((v, i) => { b[i] = v; });
            return b;
        }
        function    __reverse(){
            let i = 0;
            let l = __this.length;
            let l2= Math.floor(l/2);
            let b = null;
            for(i=0; i<l2; i++){
                b = __this[i];
                __this[i] = __this[l-1-i];
                __this[l-1-i] = b;
            }
            return __this;
        }
        function    __toBuffer(){
            return __bytes;
        }
        function    __toArray(){
            let a = [];
            __forEach((v, i) => { a.push(v?1:0); });
            return a;
        }
        function    __toNumber(){
            if(__this.length==0){ return 0; }
            let sum = 0;
            __this.forEach((v, i) => {
                if(v){
                    sum += 1<<i;
                }
            });
            return sum;
        }
    
        __construct(bitLength);
    
    }

    // static properties
    function __alloc(bitLength, fill){
        let b = new BitArray(bitLength);
        b.fill((fill===true));
        return b;
    }
    function __concat(listofBitArray){
        let sum     = 0;
        let offsets = [];
        listofBitArray.forEach((bitarr, i) => {
            offsets.push(sum);
            sum += bitarr.length;
        });
        let merged = BitArray.alloc(sum);
        listofBitArray.forEach((bitarr, i) => {
            bitarr.forEach((v, j) => {
                merged[offsets[i]+j] = v;
            });
        });
        return merged;
    }
    function __isBitArray(mixed){
        return (mixed instanceof BitArray);
    }
    function __from(mixed){
        switch(typeof mixed){
            case 'object':
                if(mixed instanceof BitArray){
                    return mixed.copy();
                } 
                if(mixed instanceof Buffer || mixed instanceof Uint8Array){
                    let l = mixed instanceof Buffer ? mixed.byteLength : mixed.length;
                    let i = 0;
                    let b = BitArray.alloc(l*8);
                    for(i=0; i<l; i++){
                        b[i*8  ] = ((mixed[i] & 128) >> 7)==1;
                        b[i*8+1] = ((mixed[i] &  64) >> 6)==1;
                        b[i*8+2] = ((mixed[i] &  32) >> 5)==1;
                        b[i*8+3] = ((mixed[i] &  16) >> 4)==1;
                        b[i*8+4] = ((mixed[i] &   8) >> 3)==1;
                        b[i*8+5] = ((mixed[i] &   4) >> 2)==1;
                        b[i*8+6] = ((mixed[i] &   2) >> 1)==1;
                        b[i*8+7] = ((mixed[i] &   1)     )==1;
                    }
                    return b;
                }
            break;
            case 'string':
                return __from(Buffer.from(mixed, 'binary'));
            break;
            case 'number':
                mixed       = Math.max(0, Math.floor(mixed));
                if(mixed==0){ return BitArray.alloc(0); }
                let b       = BitArray.alloc(Math.log2(mixed+1));
                let index   = 0;
                let carry   = 0;
                while(mixed>0){
                    carry       = mixed % 2;
                    b[index]    = (carry==1);
                    mixed       = (mixed - carry)>>1;
                    index++;
                }
                return b;
            break;
        }
        throw 'Unexpected object';
    }

    Object.defineProperties(
        BitArray,
        {
            alloc       : { value: __alloc      , writable: false, enumerable: true, configurable: false },
            concat      : { value: __concat     , writable: false, enumerable: true, configurable: false },
            isBitArray  : { value: __isBitArray , writable: false, enumerable: true, configurable: false },
            from        : { value: __from       , writable: false, enumerable: true, configurable: false }
        }
    );

    return BitArray;
})();
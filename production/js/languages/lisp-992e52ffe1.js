module.exports=function(e){var n="[a-zA-Z_\\-\\+\\*\\/\\<\\=\\>\\&\\#][a-zA-Z0-9_\\-\\+\\*\\/\\<\\=\\>\\&\\#!]*",a="(\\-|\\+)?\\d+(\\.\\d+|\\/\\d+)?((d|e|f|l|s|D|E|F|L|S)(\\+|\\-)?\\d+)?",i={className:"meta",begin:"^#!",end:"$"},s={className:"literal",begin:"\\b(t{1}|nil)\\b"},b={className:"number",variants:[{begin:a,relevance:0},{begin:"#(b|B)[0-1]+(/[0-1]+)?"},{begin:"#(o|O)[0-7]+(/[0-7]+)?"},{begin:"#(x|X)[0-9a-fA-F]+(/[0-9a-fA-F]+)?"},{begin:"#(c|C)\\("+a+" +"+a,end:"\\)"}]},l=e.inherit(e.QUOTE_STRING_MODE,{illegal:null}),g=e.COMMENT(";","$",{relevance:0}),t={begin:"\\*",end:"\\*"},r={className:"symbol",begin:"[:&]"+n},c={begin:n,relevance:0},d={begin:"\\|[^]*?\\|"},o={begin:"\\(",end:"\\)",contains:["self",s,l,b,c]},m={contains:[b,l,t,r,o,c],variants:[{begin:"['`]\\(",end:"\\)"},{begin:"\\(quote ",end:"\\)",keywords:{name:"quote"}},{begin:"'\\|[^]*?\\|"}]},v={variants:[{begin:"'"+n},{begin:"#'"+n+"(::"+n+")*"}]},u={begin:"\\(\\s*",end:"\\)"},N={endsWithParent:!0,relevance:0};return u.contains=[{className:"name",variants:[{begin:n},{begin:"\\|[^]*?\\|"}]},N],N.contains=[m,v,u,s,b,l,g,t,r,d,c],{illegal:/\S/,contains:[b,i,s,l,g,m,v,u,c]}};
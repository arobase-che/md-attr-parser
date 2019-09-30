// MD Attribute Grammer
// tested online @ <https://pegjs.org/online>

{
    function default_value(key) {
        return options.defaultValue ? options.defaultValue(key) : undefined;
    }

    function normalize_attribute_list(a, consumed) {
        let retval = {};
        retval.prop = {};
        retval.eaten = consumed;
        // * set id from first id tag
        let id_elem = a && a.find( elem => elem.id );
        if (id_elem) { retval.prop.id = id_elem.id; }
        a.forEach( elem => {
            // * convert class key to class type value
            if (elem.key === 'class') { elem.class = [ elem.value ]; delete elem.key; delete elem.value; }
            if (elem.class) {
                // * concat any new unique classes
                retval.prop.class = retval.prop.class || [];
                retval.prop.class = retval.prop.class.concat(elem.class.filter( item => retval.prop.class.indexOf(item) < 0 ));
            }
            else if (elem.id) {
                // * first id tag already used
            }
            else {
                if (elem.key === 'id') { retval.prop.id = retval.prop.id || elem.value; }
                else { retval.prop[elem.key] = retval.prop[elem.key] || elem.value; }
            }
            });
        // retval._trace = a;
        return retval;
    }
}

embedded_list =
    a:attribute_list .* { return a; }
    / a:bare_attribute_list y:(x:(w:_* eol? {return w.join('');}) .* {return x;})? { y = y || ''; a.eaten += y;return a; }

attribute_list =
//    _* '<!--' _* '-->' { return normalize_attribute_list([], ''); }
//    / _* '<!--' _* '{' _* a:attr_list _* '}' _* '-->' { return normalize_attribute_list(a, text()); }
    _* '{' _* a:attr_list _* '}' { return normalize_attribute_list(a, text()); }

bare_attribute_list =
    _* a:attr_list { return normalize_attribute_list(a, text()); }

attr_list =
    _* a:attr? b:(_+ c:attr { return c; })* { a = a || []; return [].concat(a).concat(b); }

attr =
    c:class_name+ { return {class: c}; }
    / i:id_name { return {id: i}; }
    / k:key_name _* '=' v:string { return {key: k, value: v}; }
    / k:key_name _* '=' v:value { return {key: k, value: v}; }
    / k:key_name _* '=' { return {key: k, value: ''}; }
    / k:key_name { let retval = {key: k}; let v = default_value(k); if (typeof(v) !== 'undefined') { retval.value = v; }; return retval; }

_ "whitespace" = [ \t]
eol "eol" = [\r\n]
escape_char = '\\'
space = ' '			// [\x20]
double_quote = '"'	// [\x22]
single_quote = "'"	// [\x27]
equal = '=' 		// [\x3d]
angle_open = '<'	// [\x3c]
angle_close = '>'	// [\x3e]
bracket_open = '{'	// [\x7b]
bracket_close = '}'	// [\x7d]

char = [^\0-\x1f]
name_char = [^\0-\x1f\x20\x22\x27\x3d\x3c\x3e\x7b\x7d]
value_char = name_char
quoted_chars = escape_sequence / char

escape_sequence "escape sequence" = escape_char sequence:(
    double_quote
    / single_quote
    )
    { return sequence; }

string =
    (double_quote) s:((!double_quote)c:(quoted_chars / eol {return expected('non-EOL character');}) {return c;})+ (double_quote) { return s.join(''); }
    / (single_quote) s:((!single_quote)c:(quoted_chars / eol {return expected('non-EOL character');}) {return c;})+ (single_quote) { return s.join(''); }

string_with_quotes =
    (double_quote) s:((!double_quote)c:(quoted_chars / eol {return expected('string character');}) {return c;})+ (double_quote) { return '"' + s.join('') + '"'; }
    / (single_quote) s:((!single_quote)c:(quoted_chars / eol {return expected('string character');}) {return c;})+ (single_quote) { return "'" + s.join('') + "'"; }

class_name_charset = [^.\0-\x1f\x20\x3d\x7b\x7d]
id_name_charseq = c:(escape_sequence / name_char)+ { return c.join(''); }
key_name_charset = [^.#\0-\x1f\x20\x3d\x3c\x3e\x7b\x7d]
value = text:(c:value_char)+ { return text.join(''); }

class_name = '.' n:('.'* (c:(!'.' class_name_charset)+ { return c.join(''); }) { return text(); }) { return n; }
id_name = '#' n:(string_with_quotes / id_name_charseq) { return n; }
key_name = string_with_quotes / n:(key_name_charset)+ { return n.join(''); }

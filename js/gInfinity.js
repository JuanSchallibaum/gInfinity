// Variables
var codes = new Array(8, 9, 13, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39,
                      40, 45, 46, 91, 92, 93, 112, 113, 114, 115, 116, 117, 118,
                      119, 120, 121, 122, 123, 144, 145);

function getIndex(input) {
    var index = -1, i = 0, found = false;
    while (i < input.form.length && index == -1)
        if (input.form[i] == input) index = i;
        else i++;
    return index;
}

// Listen for scroll and do infinite scroll in Google search results.
function execute() {
    alreadyloading = false;
    var nextAnchor = $('#pnnext');
    if (!nextAnchor) return;
    var href = nextAnchor.attr('href');
    var nextPage = 2;
    var previousUrl;
    $(window).scroll(function () {
        var rso = $('#rso');
        if (!rso) return;
        if (($(window).scrollTop() + $(window).height()) >= ($('body').height() * 0.9)) {
            if (alreadyloading == false) {
                alreadyloading = true;
                var parts = window.location.href.split('/');
                if (parts.length < 3) {
                    alreadyloading = false;
                    return;
                }

                if (href) {
                    $.get(href, function (data) {
                        if (document.location.href != previousUrl) {
                            nextPage = 2; // reset
                        } else {
                            nextPage++;
                        }

                        previousUrl = document.location.href;
                        var toAppend = $(data).find('#rso').html();
                        nextAnchor = $(data).find('#pnnext');
                        if (!nextAnchor) {
                            href = null;
                        } else {
                            href = nextAnchor.attr('href');
                        }

                        rso.append($('<li></li>').attr('class', 'g').html('<span style="text-shadow:1px 1px 2px #000;"><span style="color:#3364c2;font-weight:bold;font-size:large;">P</span><span style="color:#f31900;font-weight:bold;font-size:large;">a</span><span style="color:#f7d72b;font-weight:bold;font-size:large;">g</span><span style="color:#3364c2;font-weight:bold;font-size:large;">e</span> <span style="color:#44c400;font-weight:bold;font-size:large;">' + nextPage + '</span></span>'));
                        rso.append(toAppend);
                        alreadyloading = false;
                    });
                } else {
                    alreadyloading = false;
                }
            }
        }
    });
}

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    var elements = getElementsByXPath(document, request.xpath);
    if (elements && elements.length > 0) {
        $(elements[0]).focus();
    }
    sendResponse();
});

// Send xpath info about selected input field when clicking the context menu.

chrome.extension.sendRequest({ method: "getLocalStorage", key: "enable_focus" }, function (response) {
    if (response.data == "true") {
        document.addEventListener("contextmenu", function (event) {
            if ($(event.target).is(':input')) {
                var xpath = getElementXPath(event.target);
                if (!xpath || xpath == '') {
                    return;
                }

                chrome.extension.sendRequest({ xpath: xpath, method: "setXPath" }, function (response) { });
            }
        });
    }
});

$(document).ready(function () {
    if (document.location.href.indexOf('://www.google.') != -1) {
        chrome.extension.sendRequest({ method: "getLocalStorage", key: "enable_infinite_scroll" }, function (response) {
            if (response.data == "true") {
                // Wait for Google to load the page
                setTimeout('execute()', 500);
            }
        });
    }

    chrome.extension.sendRequest({ method: "getLocalStorage", key: "enable_focus" }, function (response) {
        if (response.data == "true") {
            chrome.extension.sendRequest({ method: "setFocus" }, function (response) {
            });
        }
    });

    chrome.extension.sendRequest({ method: "getLocalStorage", key: "enable_links" }, function (response) {
        if (response.data == "true" && document.getElementById && document.createTreeWalker && typeof NodeFilter != "undefined") {
            var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            var node;
            var rem = [];
            reg = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;

            while (node = tw.nextNode()) {
                if (node.nodeValue.match(reg) && node.parentNode.tagName != 'A' && node.parentNode.tagName != 'TEXTAREA' && node.parentNode.tagName != 'STYLE' && node.parentNode.tagName != 'SCRIPT') {
                    var parentElem = node.parentNode;
                    var val = node.nodeValue.replace(reg, '<a href="$1">$1</a>');
                    var aNode = document.createElement("span");
                    aNode.innerHTML = val;
                    parentElem.insertBefore(aNode, node);
                    rem.push(node);
                    continue;
                }
            }
            for (i in rem) {
                rem[i].parentNode.removeChild(rem[i]);
            }
        }
    });

    // Assign keyup listener if tabs feature enabled.

    chrome.extension.sendRequest({ method: "getLocalStorage", key: "enable_tabs" }, function (response) {
        if (response.data == "true") {
            document.onkeyup = function (event) {
                if ($.inArray(event.keyCode, codes) == -1) {
                    if ($(event.target).is('input')) {
                        if (event.target.maxLength) {
                            if (event.target.value.length >= event.target.maxLength) {
                                var index = (getIndex(event.target) + 1);
                                var mod = index % event.target.form.length;
                                var ctrl = event.target.form[mod];
                                ctrl.focus();
                            }
                        }
                    }
                }
            }
        }
    });
});

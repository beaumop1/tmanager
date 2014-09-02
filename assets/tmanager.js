/*global $:false */
/*global console:false */
/*global Handlebars:false */
/*global tiddlyweb:false */
/*global window:false */

var mySPA;

var cardTemplate;
var tiddlerModalTemplate;

var currentModalTiddlerIndex;

var slideDetail;
var outgoingSlideDetail;

var presets = [{
    name: "Osmo Projects",
    tag: "osmoproject"
}, {
    name: "Osmo Bookmarks",
    tag: "osmobookmark"
}, {
    name: "Osmo Contacts",
    tag: "osmocontact"
}, {
    name: "Cloud Voice",
    title: "Project : BTCloudVoice"
}, {
    name: "My Public",
    bag: "beaumop1-osmoprojects_public"
}, {
    name: "My Private",
    bag: "beaumop1-osmoprojects_private"
}];

//Array used to store the current tiddlers

/*
 * Extention to handlebars to allow if conditions to function within a template
 */
Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
    case '==':
        return (v1 == v2) ? options.fn(this) : options.inverse(this);
    case '===':
        return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '<':
        return (v1 < v2) ? options.fn(this) : options.inverse(this);
    case '<=':
        return (v1 <= v2) ? options.fn(this) : options.inverse(this);
    case '>':
        return (v1 > v2) ? options.fn(this) : options.inverse(this);
    case '>=':
        return (v1 >= v2) ? options.fn(this) : options.inverse(this);
    case '&&':
        return (v1 && v2) ? options.fn(this) : options.inverse(this);
    case '||':
        return (v1 || v2) ? options.fn(this) : options.inverse(this);
    default:
        return options.inverse(this);
    }
});

function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}


$("#sidebar-form").submit(function (event) {
    var spaceText = $("#sidebar-form #space").val().trim(),
        bagText = $("#sidebar-form #bag").val().trim(),
        tagText = $("#sidebar-form #tag").val().trim(),
        titleText = $("#sidebar-form #title").val().trim(),
        authorText = $("#sidebar-form #author").val().trim(),
        queryText = "";

    //var patt = /(tag|title|bag|creator|modifier):[*|A-Z|a-z|0-9]{2}.*/;
  

    if (spaceText === "") {
        spaceText = mySPA.host;
    }

    if (bagText !== "") {
        queryText = queryText.concat('bag:"').concat(bagText).concat('" ');
    }
    if (tagText !== "") {
        queryText = queryText.concat('#').concat(tagText).concat(' ');
    }
    if (titleText !== "") {
        queryText = queryText.concat('[[').concat(titleText).concat(']] ');
    }
    if (authorText !== "") {
        queryText = queryText.concat('+').concat(authorText).concat(' ');
    }

    mySPA.getTiddlers(spaceText, queryText, renderTiddlersAsCardsCallback, errorCallback);

    /*    if (patt.test(searchText)) {
            //alert(patt.test(searchText));
            mySPA.getTiddlers($("#srch-term").val(), successCallback, errorCallback);
        } else {
            alert('Invalid search');
        }
    */
    event.preventDefault();
});

$(".dropdown-menu li a").click(function () {
    var selText = $(this).text();
    $(this).parents('.input-group-btn').find('.dropdown-toggle').html(selText + ' <span class="caret"></span>');
});

function SPA(host) {
    this.host = host,
    this.tsStore = tiddlyweb.Store(null, false),
    this.tiddlers = [],
    this.workingTiddler = "";
    this.workingTiddlerIndex = -1;
}



SPA.prototype.getTiddlersOld = function (tiddlySpace, tiddlyQuery, successCallback, errorCallback) {
    console.log(tiddlySpace + "/search.json?q=" + tiddlyQuery + ";render=1;fat=1");
    $.ajax({
        url: tiddlySpace + "/search.json?q=" + tiddlyQuery + ";render=1;fat=1",
        type: "GET",
        dataType: "json",
        success: function (data, status, xhr) {
            successCallback(data);
        },
        error: function (xhr, error, exc) {
            errorCallback(error);
        }
    });
};


SPA.prototype.getInitialTiddlers = function (tiddlySpace, successCallback, errorCallback) {
    console.log('Getting initial tiddlers from host ' + this.host);
    
    var spa = this;
    
    this.tsStore = tiddlyweb.Store(function () {

        var excludeQuery = " !#excludeLists !#excludeSearch";

        spa.tiddlers = spa.tsStore(excludeQuery).unique().sort('title');
 
        successCallback(spa.tiddlers);
        
        console.log('Number of tiddlers returned = ' + spa.tiddlers.length);
               
    } );
};

SPA.prototype.getTiddlers = function (tiddlySpace, tiddlyQuery, successCallback, errorCallback) {
    console.log('Submitting query... - ' + tiddlyQuery + ' to host ' + this.host);
    
    var spa = this;
    
    var tsStore = tiddlyweb.Store(function (foo) {

        var excludeQuery = " !#excludeLists !#excludeSearch";

        if (tiddlyQuery !== null && tiddlyQuery !== "") {
            spa.tiddlers = spa.tsStore(tiddlyQuery + excludeQuery).unique().sort('title');
        } else {
            spa.tiddlers = spa.tsStore(excludeQuery).unique().sort('title');
        }
        
        successCallback(spa.tiddlers);
        
        console.log('Number of tiddlers returned = ' + spa.tiddlers.length);
        
    });
};

SPA.prototype.getTiddlerDetail = function(tiddlerIndex, flags, successCallback) {
    console.log('Getting tiddler for index position - ' + tiddlerIndex);
    
    var spa = this;
    
    this.tsStore.get(this.tiddlers[tiddlerIndex], function (tiddler) {
        spa.workingTiddlerIndex = tiddlerIndex;
        successCallback(tiddler, flags);
    }, true);
};

/*SPA.prototype.getTiddlers = function (tiddlySpace, tiddlyQuery, successCallback, errorCallback) {
    console.log(tiddlySpace + "/search.json?q=" + tiddlyQuery + ";render=1;fat=1");
    $.ajax({        
        url: tiddlySpace + "/search.json?q=" + tiddlyQuery + ";render=1;fat=1",
        type: "GET",
        dataType: "json",
        success: function (data, status, xhr) {
            renderTiddlersAsCardsCallback(data);
        },
        error: function (xhr, error, exc) {
            errorCallback(error);
        }
    });
};*/


/*SPA.prototype.getTiddlerDetailOld = function (tiddler, direction) {
    $.ajax({
        url: tiddler + ".json?render=1;fat=1",
        type: "GET",
        dataType: "json",
        success: function (data, status, xhr) {
            getTiddlerDetailSuccessCallback(data, direction);
        },
        error: function (xhr, error, exc) {
            errorCallback(error);
        }
    });
};
*/





/*SPA.prototype.saveTiddler = function(tiddler, flags, successCallback) {
    console.log('Saving tiddler - ' + tiddler.title);
	store.save(tiddler, function(response, error){
		if (response) {
			console.log('Saved tiddler');
			successCallback
			mySPA.getTiddlerDetail(tiddlers[currentModalTiddlerIndex], null, getTiddlerDetailSuccessCallback);
		} else if (error.name === 'SaveError') {
			console.log('There was a problem saving. Please try again');
		} else if (error.name === 'EmptyError') {
			console.log('There is nothing to save');
		}
	});
};
*/

SPA.prototype.saveTiddler = function(tiddler, workingTiddlerIndex, successCallback) {
	
	var spa = this;
	
	this.tsStore.save(tiddler, function(response, error){
		if (response) {
			console.log('Saved tiddler');				
			spa.getTiddlerDetail(workingTiddlerIndex, null, successCallback);
		} else if (error.name === 'SaveError') {
			console.log('There was a problem saving. Please try again');
		} else if (error.name === 'EmptyError') {
			console.log('There is nothing to save');
		}
	});
};

SPA.prototype.deleteTiddler = function(tiddlerIndex, successCallback) {	
	var spa = this;
	console.log('Deleting tiddler');
	console.log(this.tiddlers[tiddlerIndex]);
	
	successCallback();
	
/*	this.tsStore.destroy(this.tiddlers[tiddlerIndex], function(response, error){
		if (response) {
			successCallback();
		} else if (error.name === 'RemoveError') {
			console.log('There was a problem deleting. Please try again');
		} else if (error.name === 'EmptyError') {
			console.log('There is nothing to delete');
		}
	});
*/	
};


SPA.prototype.getWorkingTiddler = function() {
    return this.workingTiddler;
};

SPA.prototype.setWorkingTiddler = function(tiddler) {
    this.workingTiddler = tiddler;
};


function expandCollapseAll() {

    if ($('.sidebar-right-toggle i').hasClass('fa-expand')) {
        $('.card .panel-heading i.expand-toggle').removeClass('fa fa-chevron-up fa-2x');
        $('.card .panel-heading i.expand-toggle').addClass('fa fa-chevron-down fa-2x');
        $('.card .panel-body').closest("div").removeClass('expand');
    } else {

        $('.card .panel-heading .expand-toggle').trigger("click");

        $('.card .panel-heading i.expand-toggle').removeClass('fa fa-chevron-down fa-2x');
        $('.card .panel-heading i.expand-toggle').addClass('fa fa-chevron-up fa-2x');
        $('.card .panel-body').closest("div").addClass('expand');
    }

}

function renderTiddlersAsCardsCallback(tiddlers) {
	var col_1_html = "<div class=\"col-md-4\">",
        col_2_html = "<div class=\"col-md-4\">",
        col_3_html = "<div class=\"col-md-4\">",
        item = 0;

    $.each(tiddlers, function () {
        var col_check = item % 3;
        this.tiddlerIndex = item;
        switch (col_check) {
        case 0:
            col_1_html += cardTemplate(this);
            break;
        case 1:
            col_2_html += cardTemplate(this);
            break;
        default:
            col_3_html += cardTemplate(this);
        }

        item = item + 1;
    });

    col_1_html = col_1_html + '</div>';
    col_2_html = col_2_html + '</div>';
    col_3_html = col_3_html + '</div>';

    $("#cards").html(col_1_html + col_2_html + col_3_html);

    //Add the toggle to the new cards for the expand/collapse chevron
    $('[data-toggle=expand-panel]').click(function () {
        $('i', this).toggleClass('fa fa-chevron-up fa-2x');
        $('i', this).toggleClass('fa fa-chevron-down fa-2x');
        $('.panel-body', $(this).parent().parent().parent()).toggleClass('expand');
    });

}

function updateSearchForm() {
    var selectedPreset = $('#presetItems').val();
    $.each(presets, function () {
        if (this.name === selectedPreset) {
            $('#space').val(this.space);
            $('#bag').val(this.bag);
            $('#tag').val(this.tag);
            $('#title').val(this.title);
            $('#author').val(this.author);
        }
    });

}

function getCardBody(tiddlerIndex) {
    if ($('#tiddler-content-' + tiddlerIndex).html() === "") {
        var tiddler = mySPA.tiddlers[tiddlerIndex];
        console.log(tiddler.title);
        mySPA.tsStore.get(tiddler, function (tiddler) {
            console.log(tiddler);
            if (tiddler.type === 'image/svg+xml') {
                $('#tiddler-content-' + tiddlerIndex).html(tiddler.text);
            } else if (tiddler.type === 'image/png') {
                $('#tiddler-content-' + tiddlerIndex).html('<img src="' + tiddler.uri + '"/>');
            } else if (tiddler.render) {
                $('#tiddler-content-' + tiddlerIndex).html(tiddler.render);
            } else {
                $('#tiddler-content-' + tiddlerIndex).html('<pre>' + htmlEncode(tiddler.text) + '</pre>');
            }
        }, true);
    }
}

function getTiddlerDetailSuccessCallback(data, direction) {

	mySPA.setWorkingTiddler(null);

    renderTiddlerDetail(data, direction);

    if (direction !== null) {
        if (direction === 'deleted') {
            direction = 'next';
        }
        $("#modalCarousel").carousel(direction);
    }

}

function getTiddlerDetailForEditSuccessCallback(data, flags) {
	var editArea = $('#modalCarousel .carousel-inner .item.active .modal-dialog .modal-content .modal-body');
	
	editArea.html('<textarea class="form-control" rows="15"></textarea>');
	$('textarea', editArea).val(data.text);
	
	mySPA.setWorkingTiddler(data);
}

function deleteTiddlerSuccessCallback() {
	console.log('Tiddler deleted succesfully.');
	
	$('#modalCarousel .carousel-inner .item.active .modal-dialog .modal-content').fadeOut('fast').queue(			
        function() {							
			if (currentModalTiddlerIndex === mySPA.tiddlers.length - 1) {
				mySPA.tiddlers.splice(currentModalTiddlerIndex, 1);
				currentModalTiddlerIndex = 0;
			} else {
				mySPA.tiddlers.splice(currentModalTiddlerIndex, 1);
			}        	
			
        	if (mySPA.tiddlers.length > 0) {
				mySPA.getTiddlerDetail(currentModalTiddlerIndex, 'deleted', getTiddlerDetailSuccessCallback);
			} else {
				$('#tiddlerModal').modal('hide');
			}
		}
	);		
}


function getTiddlerDetailErrorCallback(error) {
    console.log("Error retrieving data: " + error);
}

function renderTiddlerDetail(data, direction) {

	console.log(data);

    if (slideDetail !== null && direction !== null) {
        outgoingSlideDetail = slideDetail;
    }

    slideDetail = data;

    var slideData;

    if (direction === null) {
        slideData = {
            slide1: data,
            slide2: outgoingSlideDetail
        };
    } else {
        slideData = {
            slide1: outgoingSlideDetail,
            slide2: data
        };
    }

    $('#tiddlerModal').html(tiddlerModalTemplate(slideData));

	var pageHeight = $(window).height();
    var windowHeight = Math.floor(pageHeight * 0.5);

    $('.carousel-control.left').click(function () {
        slideCard('prev');
    });
    $('.carousel-control.right').click(function () {
        slideCard('next');       
    });
    
    
    $('#tiddlerModal .modal-body').css({
        "max-height": windowHeight + 'px'
    });
        
    if (direction === 'deleted') {
    	//$('#modalCarousel').find(".item.active .modal-dialog .modal-content").css('background-color', 'red');
    	$('#modalCarousel').find(".item.active").addClass('deleted');
    }
    
    if (direction === null) {
    	$('#tiddlerModal').modal('show');
    }
	
}

function showModalCarousel(tiddlerIndex) {
    currentModalTiddlerIndex = tiddlerIndex;
    mySPA.getTiddlerDetail(tiddlerIndex, null, getTiddlerDetailSuccessCallback);
}

function slideCard(direction) {
    if (direction === 'prev') {
        if (currentModalTiddlerIndex === 0) {
            currentModalTiddlerIndex = mySPA.tiddlers.length - 1;
        } else {
            currentModalTiddlerIndex = currentModalTiddlerIndex - 1;
        }
    } else {
        if (currentModalTiddlerIndex === mySPA.tiddlers.length - 1) {
            currentModalTiddlerIndex = 0;
        } else {
            currentModalTiddlerIndex = currentModalTiddlerIndex + 1;
        }
    }

    mySPA.getTiddlerDetail(currentModalTiddlerIndex, direction, getTiddlerDetailSuccessCallback);

}

function editTiddler() {
	mySPA.getTiddlerDetail(currentModalTiddlerIndex, null, getTiddlerDetailForEditSuccessCallback);
}

function saveTiddler() {
	
	if (mySPA.getWorkingTiddler() !== null) {
	
		var tiddler = mySPA.getWorkingTiddler();
		
		tiddler.text = $('#modalCarousel .carousel-inner .item.active .modal-dialog .modal-content .modal-body textarea').val();
		
		mySPA.setWorkingTiddler(tiddler);
		
		mySPA.saveTiddler(tiddler, currentModalTiddlerIndex, getTiddlerDetailSuccessCallback);
		
	}
}

function deleteTiddler() {
	mySPA.deleteTiddler(currentModalTiddlerIndex, deleteTiddlerSuccessCallback);
}

function confirmDeleteTiddler() {	
	var options = {
        "backdrop" : "static"
	};
	
	$('#deleteConfirmModal .modal-dialog .modal-content .modal-body .tiddlerName').html('<h2>' + mySPA.tiddlers[currentModalTiddlerIndex].title + '</h2>');
	
	$('#deleteConfirmModal').modal(options);
}


$('#btnDeleteTiddler').click(function() {
	deleteTiddler();
});

$('#btnToggle').click(function() {
    if ($(this).hasClass('on')) {
        $('#main .col-md-6').addClass('col-md-4').removeClass('col-md-6');
        $(this).removeClass('on');
    } else {
        $('#main .col-md-4').addClass('col-md-6').removeClass('col-md-4');
        $(this).addClass('on');
    }
});

function Tiddler(title, html, raw) {
    this.title = title;
    this.html = html;
    this.raw = raw;
}

function errorCallback(error) {
    console.log("Error retrieving data: " + error);
}

$(function () {
    //mySPA = new SPA("http://beaumop1-osmoprojects.tiddlyspace.com");
    mySPA = new SPA("http://" + window.location.hostname);

    //Perform the initial search for tiddlers
    if ($('#container').length === 0) {
        // Get the list of tiddlers
        mySPA.getInitialTiddlers(mySPA.host, renderTiddlersAsCardsCallback, errorCallback);
    }

    //Configure the data toggle for the side bar
    $('[data-toggle=offcanvas]').click(function () {
        $('.row-offcanvas').toggleClass('active');
        $('.sidebar-toggle i').toggleClass('fa fa-chevron-right');
        $('.sidebar-toggle i').toggleClass('fa fa-chevron-left');
    });

    //Configure the data toggle for the expand/collapse all button
    $('[data-toggle=expand]').click(function () {
        $('.sidebar-right-toggle i').toggleClass('fa fa-expand');
        $('.sidebar-right-toggle i').toggleClass('fa fa-compress');
        expandCollapseAll();
    });

    //Propulate the preset dropdown
    $.each(presets, function () {
        $('#presetItems').append('<option value="' + this.name + '">' + this.name + '</option>');
    });

    $('#presetItems').on('change', function () {
        updateSearchForm();
    });

    // Get the HTML to represent the templates
    var cardTemplateScript = $("#cardTemplate").html(),
        tiddlerModalTemplateScript = $("#tiddlerModalTemplate").html();

    // Compile the templates
    cardTemplate = Handlebars.compile(cardTemplateScript);
    tiddlerModalTemplate = Handlebars.compile(tiddlerModalTemplateScript);

});

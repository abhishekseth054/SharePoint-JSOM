var Constants = {
    RootTermId: "0d4e39d4cac74c70aa0ccac11d6d955d",
    HeaderNavTermId: "7403cf53-e37e-4f43-88e4-6f7ddb174b58",
    FooterNavTermId: "0326192e-9733-4241-9f9f-16de310ee826"
};
	//Global Declarations & Variable
    var termCounter = 0;
    var allTermCount = 0;
    var customUrl = "#";
    //var TermCounter = 0;
	
	// wait until jquery load is complete
    function waituntilJqueryLoad() {
        if (window.$)
            isLoaded();
        else
            setTimeout(function () { waituntilJqueryLoad() }, 50);
    }
    
    // Execute Script when DOM is ready
    function isLoaded() {
        $(document).ready(function () {
        	$("head").append("<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1'/>");
        	var scriptbase = _spPageContextInfo.webServerRelativeUrl + "/_layouts/15/";
        	
        	$.getScript(_spPageContextInfo.siteServerRelativeUrl + "/SiteAssets/Bootstrap/js/bootstrap.min.js", function () {
                    $.getScript(scriptbase + "SP.Runtime.js", function () {
                        $.getScript(scriptbase + "SP.js", function () {
                            $.getScript(scriptbase + "SP.Taxonomy.js", execOperation);
                        });
                    });
                });
        
        });

	function execOperation() {

        var roottermid = Constants.RootTermId;
        var headerNavTermId = Constants.HeaderNavTermId;
        var footerNavTermId = Constants.FooterNavTermId;

        //Current Context
        var context = SP.ClientContext.get_current();

        if ($("#s4-bodyContainer") != null) {
            getNavigationTerms(context, roottermid, headerNavTermId, "H").done(function (headerNavigation) {
                //$(CreateHeaderNavigationHtml(headerNavigation)).insertAfter("#SideNav");
            });

            /*getNavigationTerms(context, roottermid, footerNavTermId, "F").done(function (footerNavigation) {
                $("#s4-workspace").append(CreateFooterNavigationHtml(footerNavigation));
            });*/
        }
    }
    
    function getNavigationTerms(context, roottermid, navigationtermid, flag) {
        var dfd = $.Deferred(function () {
            //Current Taxonomy Session
            var taxSession = SP.Taxonomy.TaxonomySession.getTaxonomySession(context);

            //Term Stores
            var termStores = taxSession.get_termStores();

            //Name of the Term Store from which to get the Terms.
            var termStore = termStores.getById(roottermid);

            //GUID of Term Set from which to get the Terms.
            var termSet = termStore.getTermSet(navigationtermid);

            // Get Terms inside in current termset
            var terms = termSet.get_terms();

            // Get All terms to find the count 
            var allTerms = termSet.getAllTerms();

            // Load terms 
            context.load(terms);
            context.load(allTerms);

            context.executeQueryAsync(function () {
                var navigationItem = [];

                var termEnumerator = terms.getEnumerator();
                var parentTermCounter = termEnumerator.$2I_0;
                
                var allTermsEnumerator = allTerms.getEnumerator();

                // count number of terms 
                //allTermCount = allTermsEnumerator.$2G_0;
                allTermCount = allTermsEnumerator.$2I_0;
                var whilecount = 0;
                // get term one by one and create an array 
                while (termEnumerator.moveNext()) {
                	whilecount ++;
                    var currentTerm = termEnumerator.get_current();
                    var parentNavUrl = "#";

                    if (currentTerm.get_localCustomProperties().menuUrl != undefined && currentTerm.get_localCustomProperties().menuUrl != "") {
                        parentNavUrl = currentTerm.get_localCustomProperties().menuUrl;
                    }
                    navigationItem.push({ "name": currentTerm.get_name(), "Url": parentNavUrl, "parent": "" });
						recursiveTerms(context, currentTerm, navigationItem).done(function (navItems) {
							$.each(navItems, function(key, item){
								navigationItem.push(item);
							});
							if(allTermCount === navigationItem.length)
							{	
								//if(flag == 'H') or flag == 'F' // if we have to build the footer also we can use flag like this
	                           	$(CreateHeaderNavigationHtml(navigationItem)).insertAfter("#SideNav");                            
	                        }
					});
                }
                dfd.resolve(navigationItem);
            },
            function (sender, args) {
                console.log(args.get_message());
                dfd.reject(args.get_message());
            });
        });
        return dfd.promise();
    }

    // Get the sub term
    function recursiveTerms(context, currentTerm, navigationItem) {
    	var childTermsetItem = [];
        var d = $.Deferred(function () {
            // check counter and compare with total term count to bind navigation after all term complete 
            termCounter++;

            // Get Terms inside in current termset
            var nTerms = currentTerm.get_terms();

            context.load(nTerms);

            context.executeQueryAsync(function () {
                var termsEnum = nTerms.getEnumerator();

                while (termsEnum.moveNext()) {
                    termCounter++;
                    var newCurrentTerm = termsEnum.get_current();

                    var navigationURL = "#";

                    if (newCurrentTerm.get_localCustomProperties().menuUrl != undefined && newCurrentTerm.get_localCustomProperties().menuUrl != "") {
                        navigationURL = newCurrentTerm.get_localCustomProperties().menuUrl;
                    }

                    childTermsetItem.push({ "name": newCurrentTerm.get_name(), "Url": navigationURL, "parent": currentTerm.get_name() });
                }
                d.resolve(childTermsetItem);
            }, function (sender, args) {
                console.log(args.get_message());
                d.reject();
            });
        });
        return d.promise();
    }
    
    // Return Header Navigation Html
    function CreateHeaderNavigationHtml(navigationItem) {
        var divId = "headerNavigation";

        // Create navigation according to Array with parent-chield relation 
        var navigationHtml = getMenu("", navigationItem, "", "H").join('');

        // replace comma from string     
        var navHtml = navigationHtml != null ? navigationHtml.replace(/,/g, "") : "";
        var nHTML = navHtml;
        return nHTML;
    }
   
    // Return Ul li combination with array parent child relation
    function getMenu(parentID, navigationItem, className, nav) {
        return navigationItem.filter(function (node) { return (node.parent === parentID); }).map(function (node) {
            var exists = navigationItem.some(function (childNode) { return childNode.parent === node.name; });
            var subMenu = (exists) ? '<ul>' + getMenu(node.name, navigationItem, "", nav) + '</ul>' : "";
            var mainmenu = "";
            //console.log(node);
            if (node.Url == "#") {
                if (customUrl != "") {
                    mainmenu = "<li><a href=" + customUrl + " class='" + className + "'>" + node.name + "</a>" + subMenu + "</li>";
                }
                else {
                    mainmenu = "<li><a href='javascript:void(0)' class='" + className + "'>" + node.name + "</a>" + subMenu + "</li>";
                }
            }
            else {
                if (nav == "F") {
                    mainmenu = "<li><a href='" + node.Url + "' class='" + className + "'>" + node.name + "</a>" + subMenu + "</li>";
                } else {
                    //var nodUrl = Constants.SiteCollections.slice(0, -1) + node.Url;
                    var nodUrl = node.Url;
                    if (node.parent != "") {
                        mainmenu = "<li><a href='" + nodUrl + "' target='_blank' class='" + className + "'>" + node.name + "</a>" + subMenu + "</li>";
                    } else {
                        mainmenu = "<li><a href='" + nodUrl + "' class='" + className + "'>" + node.name + "</a>" + subMenu + "</li>";
                    }
                }
            }

            return mainmenu;
        });
    }

}
_spBodyOnLoadFunctionNames.push("waituntilJqueryLoad");

frappe.pages['np-status'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Noor Status',
		single_column: true
	});

	page.main.html(frappe.render_template("np_status", { 'doc': {} }));
	

	frappe.si_list.make(wrapper, wrapper.page);
	frappe.si_list.so = ""
}



frappe.si_list = {

	make: function (wrapper, page) {
		setTimeout(() => {
			frappe.si_list.renderFilters(wrapper, page);
			// frappe.si_list.orderdate_control.set_value([frappe.datetime.month_start(), frappe.datetime.now_date()]);
			frappe.si_list.renderChart()
		}, 100);

		var me = frappe.si_list;
		me.page = page;


		frappe.si_list.table = $('#datatable');
		
		setTimeout(() => {
			frappe.si_list.buildTable(frappe.si_list.table, 8, 1)
		}, 100);

		
	},

	renderFilters: function(wrapper, page){

		frappe.si_list.order_control = frappe.ui.form.make_control({
			df: {
				label: __("Sales Order No"),
				fieldtype: 'Link',
				placeholder: __("Select Order No"),
				options: 'Sales Order',
				filters:{
					"customer":"STYLE TEXTILE (PVT) LTD."
				},
				change: function () {
					//todo
					$("#filter_btn").trigger("click");
				}
			},
			parent: $('.sales_order_control'),
			render_input: true,
		});

		// frappe.si_list.company_control = frappe.ui.form.make_control({
		// 	df: {
		// 		label: __("Company"),
		// 		fieldtype: 'Link',
		// 		placeholder: __("Select Company"),
		// 		options: 'Company',
		// 		change: function () {
		// 			//todo
		// 			$("#filter_btn").trigger("click");
		// 		}
		// 	},
		// 	parent: $('.company_control'),
		// 	render_input: true,
		// });

		// frappe.si_list.project_control = frappe.ui.form.make_control({
		// 	df: {
		// 		label: __("Project"),
		// 		fieldtype: 'Link',
		// 		placeholder: __("Select Project"),
		// 		options: 'Project',
		// 		change: function () {
		// 			//todo
		// 			$("#filter_btn").trigger("click");
		// 		}
		// 	},
		// 	parent: $('.project_control'),
		// 	render_input: true,
		// });

		page.main.on("click", "#filter_btn", function () {
			$('#item_data').html('<tr><td colspan="9" style=" text-align: center; font-weight: 500; ">NO DATA</td></tr>')
			// $('#document_status').html(`<tr>
			// 								<td>Shop Drawing</td>
			// 								<td> 0 % </td>
			// 							</tr>
			// 							<tr>
			// 								<td>Ordering</td>
			// 								<td> 0 % </td>
			// 							</tr>
			// 							<tr>
			// 								<td>Manufacturing</td>
			// 								<td> 0 % </td>
			// 							</tr>
			// 							<tr>
			// 								<td>Delivery Note</td>
			// 								<td> 0 % </td>
			// 							</tr>
			// 					`);
			frappe.si_list.table.bootstrapTable('load', frappe.si_list.setSOList(1, 10));
		})

	},
	buildTable: function ($el, cells, rows) {
		var i; var j; var row
		var columns = []
		var data = []
		// debugger;
		var options = $el.bootstrapTable('getOptions')
		data = frappe.si_list.setSOList(1, 10)
		$el.bootstrapTable({
			columns: columns,
			data: data,
			onClickRow: function(row, $element, field){
				debugger;
					frappe.si_list.so = row.order_no
					var item_html = ''
					$.each(row.items, function(k,v){
						item_html += `<tr>
							<td>`+v.item_name+`</td>
							<td>`+row.order_no+`</td>
							<td>`+row.po_no+`</td>
							<td>`+v.qty+`</td>
							<td>`+v.plan_no+`</td>
							<td></td>
							<td></td>
							<td></td>
							<td></td>
						</tr>`
					})
					$('#item_data').html(item_html)
					var sd_status = !is_null(row.sd_status) ? row.sd_status : 0; 
					var ordering_status = !is_null(row.ordering_status) ? row.ordering_status : 0; 
					var manufacturing_status = !is_null(row.manufacturing_status) ? row.manufacturing_status : 0; 
					var delivery_status = 0;
					// $('#document_status').html(`<tr class='document_row' data-so='`+row.order_no+`' data-doc='Shop Drawing'>
					// 								<td>Shop Drawing</td>
					// 								<td> `+sd_status+` % </td>
					// 							</tr>
					// 							<tr class='document_row' data-so='`+row.order_no+`' data-doc='Ordering'>
					// 								<td>Ordering</td>
					// 								<td> `+ordering_status+` % </td>
					// 							</tr>
					// 							<tr class='document_row' data-so='`+row.order_no+`' data-doc='Manufacturing'>
					// 								<td>Manufacturing</td>
					// 								<td> `+manufacturing_status+` % </td>
					// 							</tr>
					// 							<tr class='document_row' data-so='`+row.order_no+`' data-doc='Delivery Note'>
					// 								<td>Delivery Note</td>
					// 								<td> `+delivery_status+` % </td>
					// 							</tr>
					// `)
					frappe.si_list.refreshChartData([sd_status, ordering_status, manufacturing_status, delivery_status, 0]);

					// $('.document_row').on('click', function(e){
					// 	// debugger;
					// 	var so_doc = $(this).data('so');
					// 	var doctype = $(this).data('doc');
					// 	if(typeof(so_doc) != 'undefined'){
							
					// 		if(['Manufacturing', 'Shop Drawing'].includes(doctype)){
					// 			frappe.new_doc(doctype, {"sale_order": so_doc})
					// 		}
					// 		else if(doctype == 'Delivery Note'){
					// 			frappe.new_doc(doctype, {"against_sales_order": so_doc})
					// 		}
					// 		else{
					// 			frappe.new_doc(doctype, {"sales_order": so_doc})
					// 		}
							
							
					// 	}
					
						
					// })

					

			}
		})
	},
	
	setSOList: function (number, size) {
		debugger;
		let item_data = []
		frappe.call({
			method: "np_addons.np_addons.page.np_status.np_status.get_so",
			freeze: true,
			freeze_message: "Loading Realtime Data",
			args:{
				offset: (number - 1) * size,
				limit: size,
				filters: {
					orderno: frappe.si_list.order_control.get_value() != "" ? frappe.si_list.order_control.get_value() : null,
				// 	company: frappe.si_list.company_control.get_value() != "" ? frappe.si_list.company_control.get_value() : null,
				// 	project: frappe.si_list.project_control.get_value() != "" ? frappe.si_list.project_control.get_value() : null,
				}
			},

			async:false,
			callback: (r) => {

				$.each(r.message, (k, v) => {
					item_data.push({
						"order_no": v.sales_order,
						"customer": v.customer,
						"po_no": v.po_no,
						"total_qty": v.total_qty,
						"items": v.items,
					})
				})

			}
		})
		return item_data


	},
	renderChart: function(){
		// debugger;
		var dom = document.getElementById('echart_status');
		frappe.si_list.myChart = echarts.init(dom)
		var option = {
			yAxis: {
				type: 'category',
				data: ['Sales Order', 'Delivery', 'Invoice', 'Total Amount', 'Outstanding Amount']
			},
			xAxis: {
				type: 'value'
			},
			series: [
				{
				data: [200, 1000, 600, 1000, 150],
				type: 'bar'
				}
			]
		};
		frappe.si_list.myChart.setOption(option);
	  

		window.addEventListener('resize', frappe.si_list.myChart.resize);
	},
	refreshChartData: function(chartdata){
		var dataset = chartdata
		var options = {
			yAxis: {
				type: 'category',
				data: ['Sales Order', 'Delivery', 'Invoice', 'Total Amount', 'Outstanding Amount']
			},
			xAxis: {
				type: 'value'
			},
			series: [
				{
				data: dataset,
				type: 'bar'
				}
			]
		}
		frappe.si_list.myChart.setOption(options)


	}
	
}


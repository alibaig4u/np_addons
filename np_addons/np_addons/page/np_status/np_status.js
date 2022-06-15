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
			frappe.si_list.renderHeadingTiles()
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
					"customer":frappe.si_list.customer
				},
				change: function () {
					//todo
					$("#filter_btn").trigger("click");
				}
			},
			parent: $('.sales_order_control'),
			render_input: true,
		});


		page.main.on("click", "#filter_btn", function () {
			$('#item_data').html('<tr><td colspan="9" style=" text-align: center; font-weight: 500; ">NO DATA</td></tr>')
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
							<td>`+v.delivery_qty+`</td>
							<td></td>
							<td>`+v.invoice_qty+`</td>
						</tr>`
					})
					$('#item_data').html(item_html)
					var sd_status = !is_null(row.sd_status) ? row.sd_status : 0; 
					var ordering_status = !is_null(row.ordering_status) ? row.ordering_status : 0; 
					var manufacturing_status = !is_null(row.manufacturing_status) ? row.manufacturing_status : 0; 
					var delivery_status = 0;
					

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
					customer: frappe.si_list.customer != "" ? frappe.si_list.customer : null,
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
	renderHeadingTiles: function(){
		var tile_values = frappe.si_list.getCommonValues()
		$('#customer_title').html(tile_values.customer)
		$('#so_count').html(tile_values.so_count)
		$('#dn_count').html(tile_values.dn_count)
		$('#si_count').html(tile_values.si_count)
		$('#total_sales_amount').html(tile_values.total_sales_amount+" /-")
		$('#total_outstanding_amount').html(tile_values.total_outstanding_amount+" /-")
	},
	getCommonValues: function(){
		frappe.si_list.customer = ""
		var so_count = 0
		var dn_count = 0
		var si_count = 0
		var total_sales_amount = 0
		var total_outstanding_amount = 0
		frappe.call({
			method:"np_addons.np_addons.page.np_status.np_status.get_tiles_value",
			async:false,
			callback: function(r){
				if(r.message){
					var data = r.message[0]
					frappe.si_list.customer = data.customer
					so_count = data.so_count
					dn_count = data.dn_count
					si_count = data.si_count
					total_sales_amount = data.total_sales_amount
					total_outstanding_amount = data.total_outstanding_amount
					
				}
			}
		})
		return {"customer":frappe.si_list.customer,"so_count":so_count,"dn_count":dn_count,"si_count":si_count,"total_sales_amount":total_sales_amount,"total_outstanding_amount":total_outstanding_amount}
	},
	renderChart: function(){
		// debugger;
		var dom = document.getElementById('echart_status');
		var dataset = frappe.si_list.getCommonValues()
		frappe.si_list.myChart = echarts.init(dom)
		var option = {
			yAxis: {
				type: 'category',
				data: [
					// 'Outstanding Amount', 'Total Amount', 
					'Invoice', 'Delivery', 'Sales Order' ]
			},
			xAxis: {
				type: 'value'
			},
			series: [
				{
				data: [
					// dataset.total_outstanding_amount, dataset.total_sales_amount, 
					dataset.si_count, dataset.dn_count, dataset.so_count],
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
				data: ['Outstanding Amount', 'Total Amount', 'Invoice', 'Delivery', 'Sales Order' ]
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


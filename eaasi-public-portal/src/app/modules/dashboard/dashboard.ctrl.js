module.exports = ["clusters", "allClusterDetails", function (clusters, allClusterDetails) {
     const getFirstNumber = (str) => parseInt(str.match(/\d+/)[0], 10);

     var allClusterProviders = allClusterDetails.reduce(function(result, clusterResponse, index) {
         var providers = clusterResponse.data.providers;

         providers.forEach(function (provider) {
             provider.clusterName = clusters.data[index];
         });

         return result.concat(providers);
     }, []);

     // only keep elements of the type ResourceProvider
     allClusterProviders = allClusterProviders.filter(function (elem, i, arr) {
         return elem.__resource_type === 'ResourceProvider';
     });

     var resourceProviders = allClusterProviders.map(function (resourceProvider) {
         var nodes = resourceProvider.resource_allocator.nodes.map(function (node) {
             var node_pool_node = resourceProvider.node_pool.nodes.filter(function (n) { return n.id === node.id })[0];

             var nodeUsedCPU = 0;
             var nodeUsedMemory = 0;
             node.allocations.forEach(function (allocation) {
                 nodeUsedCPU += getFirstNumber(allocation.spec.cpu);
                 nodeUsedMemory += getFirstNumber(allocation.spec.memory);
             });

             var nodeAllocations = node.allocations.map(function (allocation) {
                 return {
                     id: allocation.id,
                     allocated_cpu: getFirstNumber(allocation.spec.cpu) / 1000,
                     allocated_memory: getFirstNumber(allocation.spec.memory)
                 };
             });

             var free_cpu = getFirstNumber(node.free_resources.cpu) / 1000;
             var used_cpu = nodeUsedCPU / 1000;
             var capacity_cpu = free_cpu + used_cpu;

             var free_memory = getFirstNumber(node.free_resources.memory);
             var used_memory = nodeUsedMemory;
             var capacity_memory = free_memory + used_memory;

             return {
                 id: node.id,
                 used: node_pool_node.used,
                 healthy: node_pool_node.healthy,
                 capacity_cpu: capacity_cpu,
                 chart_cpu_values: [free_cpu, used_cpu],
                 capacity_memory: capacity_memory,
                 chart_memory_values: [free_memory, used_memory],
                 allocations: nodeAllocations
             };
         });


         var capacity_cpu = getFirstNumber(resourceProvider.node_pool.capacity.cpu) / 1000;
         var free_cpu = resourceProvider.resource_allocator.nodes.reduce(function (r, n) { return r + getFirstNumber(n.free_resources.cpu) }, 0) / 1000;
         var pending_cpu = getFirstNumber(resourceProvider.node_pool.pending.cpu) / 1000;
         var used_cpu = capacity_cpu - pending_cpu - free_cpu;

         var capacity_memory = getFirstNumber(resourceProvider.node_pool.capacity.memory);
         var free_memory = resourceProvider.resource_allocator.nodes.reduce(function (r, n) { return r + getFirstNumber(n.free_resources.memory) }, 0);
         var pending_memory = getFirstNumber(resourceProvider.node_pool.pending.memory);
         var used_memory = capacity_memory - pending_memory - free_memory;

         return {
             name: resourceProvider.name,
             type: resourceProvider.type,
             cluster_name: resourceProvider.clusterName,
             num_requests: resourceProvider.metrics.num_requests,
             num_requests_deferred: resourceProvider.metrics.num_requests_deferred,
             num_requests_expired: resourceProvider.metrics.num_requests_expired,
             num_requests_failed: resourceProvider.metrics.num_requests_failed,
             num_nodes: resourceProvider.resource_allocator.num_nodes,
             capacity_cpu: capacity_cpu,
             chart_cpu_values: [free_cpu, used_cpu, pending_cpu],
             capacity_memory: capacity_memory,
             chart_memory_values: [free_memory, used_memory, pending_memory],
             nodes: nodes,
             nodes_usage: [resourceProvider.node_pool.num_used_nodes, resourceProvider.node_pool.num_unused_nodes],
             nodes_health: [resourceProvider.node_pool.num_healthy_nodes, resourceProvider.node_pool.num_unhealthy_nodes],
             allocation_requests: resourceProvider.allocation_requests || {num_entries: 0}
         };
     });

     var vm = this;

     vm.resourceProviders = resourceProviders;

     vm.chartNodeUsageLabels = ['Used Nodes', 'Unused Nodes'];
     vm.chartNodeHealthLabels = ['Healthy Nodes', 'Unhealthy Nodes'];
     vm.chartCPULabels = ['Free CPU', 'Used CPU', 'Pending CPU'];
     vm.chartMemoryLabels = ['Free Memory', 'Used Memory', 'Pending Memory'];
     vm.chartNodeCPULabels = ['Free CPU', 'Used CPU'];
     vm.chartNodeMemoryLabels = ['Free Memory', 'Used Memory'];

     vm.chartNodesOptions = {
         rotation: Math.PI,
         circumference: Math.PI,
         legend: {
             display: true,
             position: 'bottom'
         }
     };

     vm.chartCPUOptions = {
         rotation: Math.PI,
         circumference: Math.PI,
         legend: {
             display: true,
             position: 'bottom'
         },
         tooltips: {
             callbacks: {
                 label: function (tooltipItem, data) {
                     return ' ' + data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'm';
                 }
             }
         }
     };

     vm.chartMemoryOptions = {
         rotation: Math.PI,
         circumference: Math.PI,
         legend: {
             display: true,
             position: 'bottom'
         },
         tooltips: {
             callbacks: {
                 label: function (tooltipItem, data) {
                     return ' ' + data.labels[tooltipItem.index] + ': ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'MB';
                 }
             }
         }
     };

     vm.nodeChartCPUOptions = {
         rotation: Math.PI,
         circumference: Math.PI,
         legend: {
             display: true,
             position: 'bottom'
         },
         tooltips: {
             callbacks: {
                 label: function (tooltipItem, data) {
                     return ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'm';
                 }
             }
         }
     };

     vm.nodeChartMemoryOptions = {
         rotation: Math.PI,
         circumference: Math.PI,
         legend: {
             display: true,
             position: 'bottom'
         },
         tooltips: {
             callbacks: {
                 label: function (tooltipItem, data) {
                     return ' ' + data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + 'MB';
                 }
             }
         }
     };
 }];
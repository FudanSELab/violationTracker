package cn.edu.fudan.issueservice.util;

import cn.edu.fudan.issueservice.domain.dbo.RangeCommitEdge;

import java.util.*;

/**
 * @Description
 *
 * @Copyright DoughIt Studio - Powered By DoughIt
 * @author Jerry Zhang <https://github.com/doughit>
 * @date 2022-08-08 14:15
 */
public class EdgeWeightDigraph {
    private final Map<String, List<RangeCommitEdge>> adjacentEdgeMap;
    private final Set<String> vertexes;

    public EdgeWeightDigraph() {
        this.adjacentEdgeMap = new HashMap<>(8);
        this.vertexes = new HashSet<>(8);
    }

    public void addEdge(RangeCommitEdge edge) {
        String newCommitId = edge.getNewCommit().getCommitId();
        vertexes.add(edge.getOldCommit().getCommitId());
        vertexes.add(newCommitId);
        if (adjacentEdgeMap.containsKey(newCommitId)) {
            adjacentEdgeMap.get(newCommitId).add(edge);
        }else{
            adjacentEdgeMap.put(newCommitId, new ArrayList<>(){{
                add(edge);
            }});
        }
    }

    public List<RangeCommitEdge> adj(String commitId){
        return adjacentEdgeMap.getOrDefault(commitId,new ArrayList<>());
    }

    public List<String> getVertexes() {
        return new ArrayList<>(vertexes);
    }
}

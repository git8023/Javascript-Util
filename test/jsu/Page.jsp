<%@ page import="java.util.*" %>

<%!
    final static List<Map<String, Object>> list = new ArrayList<Map<String, Object>>();

    static {
        Random random = new Random();
        int max = random.nextInt(100000) + 1000;
        for (int i = 0; i < max; i++) {
            Map<String, Object> map = new HashMap<String, Object>();
            map.put("name", "NAME-" + i);
            map.put("gender", random.nextBoolean() ? "MALE" : "FEMALE");
            map.put("date", new Date());
            map.put("note", "NOTE-" + i);
            list.add(map);
        }
    }
%>

<%
    response.setContentType("application/json;charset=utf8");

    int size = Integer.valueOf(request.getParameter("size"));
    int index = Integer.valueOf(request.getParameter("index"));
    int begin = (index - 1) * size;
    int end = index * size;

    List<Map<String, Object>> maps = list.subList(begin, end);
    StringBuilder buf = new StringBuilder("[");
    for (Map<String, Object> map : maps) {
        buf.append("{");
        for (Map.Entry<String, Object> me : map.entrySet()) {
            buf.append("\"").append(me.getKey()).append("\":");
            Object value = me.getValue();
            if (value instanceof Date) {
                buf.append(((Date) value).getTime());
            } else {
                buf.append("\"").append(value).append("\"");
            }
            buf.append(",");
        }
        buf.deleteCharAt(buf.length() - 1).append("},");
    }
    buf.deleteCharAt(buf.length() - 1).append("]");

    String ret = "{" +
//            "\"flag\":" + new Random().nextBoolean() + "," +
            "\"flag\":" + (0 != index % 3) + "," +
            "\"data\": {" +
                "\"total\":" + (list.size() + size - 1) / size + "," +
                "\"index\":" + index + "," +
                "\"data\":" + buf + "}" +
            "}";
    response.getWriter().write(ret);

%>
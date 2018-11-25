<%@ page import="java.util.Map" %>
<%
    Map pmap = request.getParameterMap();
    System.out.println(pmap);
    response.setContentType("application/json:charset=utf8");
    response.getWriter().write("{\"resp\":123}");
%>
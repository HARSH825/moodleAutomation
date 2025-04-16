function parseContentSections(content, title) {
    //spliiter logic
    return {
      title,
      aim: extract(content, "AIM"),
      algorithm: extract(content, "ALGORITHM"),
      code: extract(content, "CODE"),
      observation: extract(content, "OBSERVATION"),
      conclusion: extract(content, "CONCLUSION"),
    };
  }
  
  function extract(content, heading) {
    const regex = new RegExp(`${heading}[:\\n]+([\\s\\S]*?)(?=\\n[A-Z]{2,}|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : "";
  }
  
  export default parseContentSections;
  
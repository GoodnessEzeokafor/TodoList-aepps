const contractSource = `
contract TodoList =
  record todolist= {
        todo:string,
        creator:address,
        created:int,
        completedAt:int,
        completed:bool}
  record state = {
    index_counter : int,
    todolists : map(address, todolist)}
    
  stateful entrypoint init() =
    { index_counter = 0,
      todolists = {}}
    
  stateful entrypoint add_new_todolist(_todo : string)=
    if(_todo != "")
      let new_todo ={todo =_todo, creator=Call.caller,created=Chain.timestamp,completed=false,completedAt=0}
      let index = state.index_counter + 1
      put(state{todolists[Call.caller] = new_todo, index_counter=index})
        
  entrypoint get_todolist_length() : int = 
    state.index_counter

  entrypoint get_todolist_by_address(_owner:address)=
    switch(Map.lookup(_owner, state.todolists))
      None => abort("There was no Todolist with this index.")
      Some(x) => x

  stateful entrypoint complete_todo(_owner:address) =
    let get_todo = get_todolist_by_address(_owner)
    let new_todo ={
                todo=get_todo.todo, 
                creator=get_todo.creator,
                created=get_todo.created, completed=true,completedAt=Chain.timestamp}
    put(state{todolists[get_todo.creator] = new_todo})

  stateful entrypoint delete_todo(_owner:address)=
    switch(Map.lookup(_owner, state.todolists))
      Some(x) => put(state{todolists = Map.delete(_owner,state.todolists)})

`
const contractAddress ='ct_2rkZrcZS5imFPnRGSPKcETx1xju5ecVB1HvirR4rrqfeFwrG7i'

var client = null // client defuault null
user_address =null // clienr user address default null
var todoListArr = [] // empty projects array
var todoListLength = 0 // empty product list lenghth

// asychronus read from the blockchain
async function callStatic(func, args) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  return decodedGet;
}

//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  console.log("Contract:", contract)
  const calledSet = await contract.call(func, args, {amount:value}).catch(e => console.error(e));
  console.log("CalledSet", calledSet)
  return calledSet;
}


// mustche

function renderTodoList(){
  let template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {todoListArr});
  $("#getTodos").html(rendered); // id to render your temlplate
  console.log("Project Template Display")
}






window.addEventListener('load', async() => {
  $("#loader").show();

  client = await Ae.Aepp();
  user_address = await client.address()

  console.log("Client:",client)
  console.log("Client Address", user_address);
  todoListLength = await callStatic('get_todolist_length',[]);
  console.log('TodoList Length: ', todoListLength);


  // Todolist Loop
  for(let i = 1; i < todoListLength + 1; i++){
    const getTodoList = await callStatic('get_todolist_by_address', [user_address]);
    if(getTodoList){
        todoListArr.push({
            index_counter:i,
            todo:getTodoList.todo,
          //   id:getProjectList.id,
            created:new Date(getTodoList.created),
            completedAt:new Date(getTodoList.completedAt),
            creator:getTodoList.creator,
            completed:getTodoList.completed
          })
    }

}
renderTodoList()
$("#loader").hide();

})


// add project
//click the Create Button
$("#addButton").click(async function(){
  console.log("Button Clicked....");
  $("#loader").show();

  var todo = ($("#todo").val());
  console.log(todo)
  // console.log(new Date(new_deadline))
const new_todo = await contractCall('add_new_todolist', [todo],0);
console.log(new_todo)
  // // clear
  $("#todo").val("");
  $("#loader").hide();
})
 
// Complete Todo
$("#getProject").on("click",".complete", async function(event){
  $("#loader").show();

  console.log("Completed Task Clicked")
//   const dataIndex = event.target.id

//   console.log(typeof dataIndex)
  const complete_task = await contractCall('complete_todo', [user_address],0);

  console.log("-----------------")
  console.log(complete_task)
  console.log("--------------------------")
  
  event.preventDefault();
  renderTodoList()
  $("#loader").hide();
});



$("#getProject").on("click",".delete", async function(event){
    $("#loader").show();
  
    console.log("Completed Task Clicked")
  //   const dataIndex = event.target.id
  
  //   console.log(typeof dataIndex)
    const delete_all = await contractCall('delete_todo', [user_address],0);
  
    console.log("-----------------")
    console.log(delete_all)
    console.log("--------------------------")
    event.preventDefault();
    renderTodoList()
    $("#loader").hide();
  });
  
